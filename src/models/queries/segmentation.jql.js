/* global Events, People, join, mixpanel, module, params, _*/
/* eslint camelcase:0 */

// parameterized JQL segmentation query
//
// sample params format:
// {
//   dates: {
//     from: '2016-05-04',
//     to: '2016-05-05',
//     unit: 'hour',
//   },
//   events: [
//     {
//       event: 'Viewed report',
//     },
//   ],
//   groups: [
//    '$browser',
//    'mp_country_code',
//    '$city',
//    'tab',
//   ],
// }

function main() {
  var getEvent = function(eventData) {
    return eventData.event || eventData;
  };

  var groups = [];
  if (params.outputName) {
    groups.push(function() {
      return params.outputName;
    });
  } else if (params.selectors && params.selectors.length) {
    groups.push(params.needsPeopleData ? 'event.name' : 'name');
  }

  var offset = groups.length;
  var groupsToReduceByIndex = [];
  _.each(params.groups, function(group, index) {
    if (['string', 'list'].includes(group.filterType)) {
      groupsToReduceByIndex.push(index + offset);
    }
  });

  var getPropertyPaths = function(propertyName, propertyResourceType) {
    var paths = [];
    if (params.needsPeopleData) {
      paths.push(propertyResourceType === 'people' ? 'user' : 'event');
    }
    return paths.concat('properties', propertyName);
  };

  if (params.groups) {
    groups = groups.concat(params.groups.map(function(group) {
      var jqlGroup;
      jqlGroup = getPropertyPaths(group.value, group.resourceType).join('.');
      if (group.buckets) {
        jqlGroup = mixpanel.numeric_bucket(jqlGroup, group.buckets);
      }
      return jqlGroup;
    }));
  }

  // TODO(chi): do we want to keep the 'reset from_date back to the first day of unit' behavior for
  // month and quarter?
  var timeUnitGroupBySelector;
  switch(params.dates.unit) {
    case 'all':
      timeUnitGroupBySelector = function() { return 'all'; };
      break;
    case 'hour':
      timeUnitGroupBySelector = mixpanel.event_strftime('%F %H');
      break;
    case 'day':
      timeUnitGroupBySelector = mixpanel.event_strftime('%F');
      break;
    case 'week':
      // TODO(chi): consider just '%G'
      var getMonday = function(date) {
        date = new Date(date);
        var day = date.getDay();
        var offset = day > 0 ? day - 1 : 6;
        date.setDate(date.getDate() - offset);
        return date.toISOString().split('T')[0];
      };
      timeUnitGroupBySelector = mixpanel.event_strftime('%Y %W');
      params.dates.from = getMonday(params.dates.from);
      break;
    case 'month':
      var getFirstOfMonth = function(date) {
        date = new Date(date);
        date.setDate(1);
        return date.toISOString().split('T')[0];
      };
      timeUnitGroupBySelector = mixpanel.event_strftime('%Y-%m');
      params.dates.from = getFirstOfMonth(params.dates.from);
      break;
    case 'quarter':
      var getStartOfQuarter = function(date) {
        date = new Date(date);
        var qMonth = Math.floor(date.getMonth() / 3) * 3 + 1;
        if (qMonth < 10) {
          qMonth = '0' + qMonth;
        }
        return date.toISOString().split('T')[0].replace(/(\d+)-\d\d-\d\d/, '$1-' + qMonth + '-01');
      };
      var quarterStarts = [];
      var lastQuarterStart = new Date(getStartOfQuarter(params.dates.to));
      for (var quarterStart = new Date(getStartOfQuarter(params.dates.from));
           quarterStart <= lastQuarterStart;
           quarterStart.setMonth(quarterStart.getMonth + 3)) {
        quarterStarts.push(quarterStart.getTime());
      }
      timeUnitGroupBySelector = mixpanel.numeric_bucket(function(eventData) {
        return getEvent(eventData).time;
      }, quarterStarts);
      params.dates.from = getStartOfQuarter(params.dates.from);
      break;
  }
  groups.push(timeUnitGroupBySelector);

  groups = [mixpanel.multiple_keys(groups)];

  // TODO(dmitry, chi) use mixpanel.slice()
  // https://docs.google.com/document/d/1u8iNUhGyFIyIN7xpPkhgdorITuj4BBUYTs0SLwetzA8/edit#heading=h.ipjo3e54gdd2
  var sliceOffDistinctId = function(row) {
    return row.key.slice(1);
  };

  var reducerFuncs = function(type, accessor) {
    accessor = accessor || function(item) { return item.value; };
    var reducerFunc;
    switch (type) {
      case 'average':
        // TODO(chi) numeric_summary doesn't support non-function accessors yet, otherwise
        // 'accessor's default value can be just 'value'
        reducerFunc = mixpanel.reducer.numeric_summary(accessor);
        break;
      case 'max':
        reducerFunc = mixpanel.reducer.max(accessor);
        break;
      case 'median':
        reducerFunc = mixpanel.reducer.numeric_percentiles(accessor, [50]);
        break;
      case 'min':
        reducerFunc = mixpanel.reducer.min(accessor);
        break;
      case 'total':
        reducerFunc = mixpanel.reducer.sum(accessor);
        break;
    }
    return reducerFunc;
  };

  var postprocessFuncs = {
    average: function(item) {
      item.value = item.value.sum / item.value.count;
      return item;
    },
    median: function(item) {
      item.value = item.value[0].value;
      return item;
    },
  };

  postprocessFuncs.max = postprocessFuncs.min = function(item) {
    item.value = item.value.value;
    return item;
  };

  var query;
  var queryParams = {
    from_date: params.dates.from,
    to_date: params.dates.to,
  };
  if (params.needsPeopleData) {
    // TODO(dmitry,chi) instead of filtering on tuples with event being set, use
    // left join:
    // https://docs.google.com/document/d/1u8iNUhGyFIyIN7xpPkhgdorITuj4BBUYTs0SLwetzA8/edit#heading=h.ydojn9viwz60
    query = join(Events(queryParams), People(), {selectors: params.selectors})
      .filter(function(tuple) { return !!tuple.event; });
  } else {
    queryParams.event_selectors = params.selectors;
    query = Events(queryParams);
  }

  var needPostprocess = true;
  if (params.property) {
    var accessNumericPropertyOrReturnDefaultValue = function(propertyName, propertyResourceType, defaultValue) {
      return function(eventData) {
        if (!eventData) {
          return defaultValue;
        }

        var property = getPropertyPaths(propertyName, propertyResourceType)
          .reduce(function(property, path) {
            return property[path];
          }, eventData);

        return _.isNumber(property) ? property : defaultValue;
      };
    };
    var accessorFuncs = {
      min: accessNumericPropertyOrReturnDefaultValue(params.property.name, params.property.resourceType, Number.MAX_VALUE),
    };
    // TODO(chi): Have the accessor return any number for 'average' or 'median' when the property
    // isn't a number yields inaccurate result. The fundamental issue is what do do when a numeric
    // property of a user is non-existent or not numeric?
    accessorFuncs.average = accessorFuncs.median = accessorFuncs.max = accessorFuncs.total =
      accessNumericPropertyOrReturnDefaultValue(params.property.name, params.property.resourceType, 0);
    if (params.property.resourceType === 'people') {
      query = query.groupByUser(groups, function(accumulators, events) {
        // TODO(dmitry, chi) use join(Events(), People(), {type:"left"}).groupByUser(mixpanel.reducer.any())
        // instead.
        return _.find(events, function(eventData) {
          return !!eventData.user;
        });
      }).groupBy([sliceOffDistinctId], reducerFuncs(params.type, accessorFuncs[params.type]));
    } else {
      if (!['min', 'max'].includes(params.type)) {
        query = query.groupBy(groups, reducerFuncs(params.type, accessorFuncs[params.type]));
      } else {
        // TODO(chi): mixpanel.reducer.min/max cannot be used on events directly yet, so we are
        // still on the old way for these types.

        var operatorFuncs = {
          // TODO(dmitry, chi) use mixpanel.reducer.min()
          min: function(list) {
            return _.min(list);
          },
          // TODO(dmitry, chi) use mixpanel.reducer.max()
          max: function(list) {
            return _.max(list);
          },
        };

        var toPropertyList = function(accumulators, events) {
          var list = [];
          _.each(accumulators, function(a) {
            _.each(a, function(prop) {
              list.push(prop);
            });
          });
          _.each(events, function(eventData) {
            list.push(getEvent(eventData).properties[params.property.name]);
          });
          return list;
        };

        query = query.groupBy(groups, toPropertyList);

        // TODO(dmitry, chi) this .map() step becomes unnecessary if a built-in numeric
        // reducer is used.
        query = query.map(function(item) {
          item.value = _.filter(item.value, function(v) { return v && _.isNumber(v); });
          item.value = item.value.length ? operatorFuncs[params.type](item.value) : 0;
          return item;
        });
        needPostprocess = false;
      }
    }
  } else if (params.type === 'total') {
    query = query.groupBy(groups, mixpanel.reducer.count({account_for_sampling: true}));
  } else if (params.type === 'unique') {
    query = query.groupByUser(groups, mixpanel.reducer.noop())
      .groupBy([sliceOffDistinctId], mixpanel.reducer.count());
  } else {
    query = query.groupByUser(groups, mixpanel.reducer.count({account_for_sampling: true}))
      .groupBy([sliceOffDistinctId], reducerFuncs(params.type));
  }
  if (_.keys(postprocessFuncs).includes(params.type) && needPostprocess) {
    query = query.map(postprocessFuncs[params.type]);
  }

  if (groupsToReduceByIndex.length > 0) {
    var counts = {};
    query = query.map(function(item) {
      _.each(groupsToReduceByIndex, function(index) {
        var key = item.key[index];
        var keys = item.key.slice(0, index).concat(item.key.slice(index + 1));
        var group = counts[index] || {};
        var keys_obj = group[keys] || {};
        var value = keys_obj[key] || 0;
        keys_obj[key] = value + item.value;
        group[keys] = keys_obj;
        counts[index] = group;
      });
      return item;
    });

    var tops = {};
    query = query.reduce(function (accumulators, items) {
      var result = [];
      _.each(items, function(item) {
        result.push(item);
      });
      _.each(accumulators, function(a) {
        _.each(a, function(i) {
          result.push(i);
        });
      });
      return result;
    }).reduce(function(accumulators, lists) {
      var tops = {};
      _.each(_.keys(counts), function(index) {
        tops[index] =  _.chain(counts[index])
          .values()
          .map(function(key_counts) {
            return _.chain(key_counts)
              .keys()
              .map(function(key) { return {'key': key, 'count': key_counts[key]}; })
              .sortBy('count')
              .pluck('key')
              .first(10)
              .value();
          })
          .flatten()
          .union()
          .indexBy()
          .value();
      });

      var items = [];
      _.each(lists, function(list) {
        _.each(list, function(item) {
          items.push(item);
        });
      });

      _.each(accumulators, function(a) {
        _.each(a.items, function(i) {
          items.push(i);
        });
      });

      return {items: items, tops: tops};
    }).map(function(object) {
      tops = object.tops;
      return object.items;
    }).flatten()
      .filter(function(item) {
        return _.find(groupsToReduceByIndex, function(index) {
          return _.has(tops[index], item.key[index]);
        });
      });
  }

  return query;
}

// ===== JQL CODE ENDS
// anything below this line will not be sent to the JQL backend

module.exports = main;
