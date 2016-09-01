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

  if (params.groups) {
    var getPropertyPath = function(group) {
      return (params.needsPeopleData ? [group.resourceType === 'people' ? 'user' : 'event'] : [])
        .concat(['properties', group.value])
        .join('.');
    };

    groups = groups.concat(params.groups.map(function(group) {
      var jqlGroup;
      if (group.buckets) {
        jqlGroup = mixpanel.numeric_bucket(getPropertyPath(group), group.buckets);
      } else {
        jqlGroup = getPropertyPath(group);
      }
      return jqlGroup;
    }));
  }

  // TODO(dmitry, chi) use mixpanel.event_strftime() instead:
  // https://docs.google.com/document/d/1u8iNUhGyFIyIN7xpPkhgdorITuj4BBUYTs0SLwetzA8/edit#heading=h.csmrukb98pb9
  var timeUnitGroupByFunc;
  switch(params.dates.unit) {
    case 'all':
      timeUnitGroupByFunc = function() { return 'all'; };
      break;
    case 'hour':
      timeUnitGroupByFunc = function(eventData) {
        var dateMatch = (new Date(getEvent(eventData).time)).toISOString().match(/(.+)T(\d\d):/);
        return `${dateMatch[1]} ${dateMatch[2]}:00:00`;
      };
      break;
    case 'day':
      timeUnitGroupByFunc = function(eventData) {
        return (new Date(getEvent(eventData).time)).toISOString().split('T')[0];
      };
      break;
    case 'week':
      var getMonday = function(date) {
        date = new Date(date);
        var day = date.getDay();
        var offset = day > 0 ? day - 1 : 6;
        date.setDate(date.getDate() - offset);
        return date.toISOString().split('T')[0];
      };
      timeUnitGroupByFunc = function(eventData) {
        return getMonday(getEvent(eventData).time);
      };
      params.dates.from = getMonday(params.dates.from);
      break;
    case 'month':
      var getFirstOfMonth = function(date) {
        date = new Date(date);
        date.setDate(1);
        return date.toISOString().split('T')[0];
      };
      timeUnitGroupByFunc = function(eventData) {
        return getFirstOfMonth(getEvent(eventData).time);
      };
      params.dates.from = getFirstOfMonth(params.dates.from);
      break;
    // TODO(dmitry,chi) mixpanel.event_strftime() does not currently support "quarter".
    // Use mixpanel.numeric_bucket() on event.time instead?
    case 'quarter':
      var getStartOfQuarter = function(date) {
        date = new Date(date);
        var qMonth = Math.floor(date.getMonth() / 3) * 3 + 1;
        if (qMonth < 10) {
          qMonth = '0' + qMonth;
        }
        return date.toISOString().split('T')[0].replace(/(\d+)-\d\d-\d\d/, '$1-' + qMonth + '-01');
      };
      timeUnitGroupByFunc = function(eventData) {
        return getStartOfQuarter(getEvent(eventData).time);
      };
      params.dates.from = getStartOfQuarter(params.dates.from);
      break;
  }
  groups.push(timeUnitGroupByFunc);

  groups = [mixpanel.multiple_keys(groups)];

  // TODO(dmitry, chi) use mixpanel.reducer.count({with_sampling: true})
  // https://docs.google.com/document/d/1u8iNUhGyFIyIN7xpPkhgdorITuj4BBUYTs0SLwetzA8/edit#heading=h.cb8sr1s1dow
  var countWithSampling = function(counts, events) {
    var count = 0;
    for (var i = 0; i < events.length; i++) {
      var ev = getEvent(events[i]);
      if (ev.sampling_factor && ev.sampling_factor <= 1.0) {
        count += 1.0 / ev.sampling_factor;
      } else {
        count++;
      }
    }
    for (i = 0; i < counts.length; i++) {
      count += counts[i];
    }
    return Math.round(count);
  };

  // TODO(dmitry, chi) use mixpanel.slice()
  // https://docs.google.com/document/d/1u8iNUhGyFIyIN7xpPkhgdorITuj4BBUYTs0SLwetzA8/edit#heading=h.ipjo3e54gdd2
  var sliceOffDistinctId = function(row) {
    return row.key.slice(1);
  };

  var operatorFuncs = {
    // TODO(dmitry, chi) use mixpanel.reducer.sum()
    total: function(list) {
      return _.reduce(list, function(sum, num) { return sum + num; });
    },
    // TODO(dmitry, chi) use mixpanel.reducer.numeric_summary()
    average: function(list) {
      return list.reduce(function(prev, curr) { return prev + curr; }) / list.length;
    },
    // TODO(dmitry, chi) use mixpanel.reducer.numeric_percentiles(50)
    median: function(list) {
      var median;
      list.sort(function(a, b) { return a - b; });
      var length = list.length;
      if (length % 2 === 0) {
        median = (list[length / 2 - 1] + list[length / 2]) / 2;
      } else {
        median = list[(length - 1) / 2];
      }
      return median;
    },
    // TODO(dmitry, chi) use mixpanel.reducer.min()
    min: function(list) {
      return _.min(list);
    },
    // TODO(dmitry, chi) use mixpanel.reducer.min()
    max: function(list) {
      return _.max(list);
    },
  };

  // TODO(dmitry,chi) instead of collecting all source in a list and applying
  // post-processing, use one of streaming reducers JQL provides:
  // https://docs.google.com/document/d/1u8iNUhGyFIyIN7xpPkhgdorITuj4BBUYTs0SLwetzA8/edit#heading=h.cb8sr1s1dow
  var toList = function(accumulators, items) {
    var output = items.map(function(item) { return item.value; });
    _.each(accumulators, function(a) {
      _.each(a, function(item) {
        output.push(item);
      });
    });
    return output;
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

  if (params.property) {
    if (params.property.resourceType === 'people') {
      query = query.groupByUser(groups, function(accumulators, events) {
        // TODO(dmitry, chi) use join(Events(), People(), {type:"left"}).groupByUser(mixpanel.reducer.any())
        // instead.
        var eventData = _.find(events, function(eventData) {
          return !!eventData.user;
        });
        return eventData ? eventData.user.properties[params.property.name] : eventData;
      }).groupBy([sliceOffDistinctId], toList);
    } else {
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
    }

    // TODO(dmitry, chi) this .map() step becomes unnecessary if a built-in numeric
    // reducer is used.
    query = query.map(function(item) {
      item.value = _.filter(item.value, function(v) { return v && _.isNumber(v); });
      item.value = item.value.length ? operatorFuncs[params.type](item.value) : 0;
      return item;
    });
  } else if (params.type === 'total') {
    query = query.groupBy(groups, countWithSampling);
  } else if (params.type === 'unique') {
    query = query.groupByUser(groups, mixpanel.reducer.noop())
      .groupBy([sliceOffDistinctId], countWithSampling);
  } else {
    // TODO(dmitry, chi) use mixpanel.reducer.count({with_sampling_factor:true})
    // https://docs.google.com/document/d/1u8iNUhGyFIyIN7xpPkhgdorITuj4BBUYTs0SLwetzA8/edit#heading=h.cb8sr1s1dow
    var countWithSamplingForGroupByUser = function(count, events) {
      count = count || 0;
      for (var i = 0; i < events.length; i++) {
        var ev = events[i].event || events[i];
        if (ev.sampling_factor && ev.sampling_factor <= 1.0) {
          count += 1.0 / ev.sampling_factor;
        } else {
          count++;
        }
      }
      return Math.round(count);
    };

    query = query.groupByUser(groups, countWithSamplingForGroupByUser)
      .groupBy([sliceOffDistinctId], toList)
      // TODO(dmitry, chi) this .map() step becomes unnecessary if a built-in numeric
      // reducer is used.
      .map(function(item) {
        item.value = operatorFuncs[params.type](item.value);
        return item;
      });
  }

  return query;
}

// ===== JQL CODE ENDS
// anything below this line will not be sent to the JQL backend

module.exports = main;
