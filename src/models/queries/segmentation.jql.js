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
//     {
//       value: '$browser_version',
//       resourceType: 'number'
//     },
//     {
//       value: 'mp_country_code',
//       resourceType: 'string'
//     },
//     {
//       value: '$city',
//       resourceType: 'string'
//     }
//   ],
// }

function main() {
  var groups = [];
  if (params.outputName) {
    groups.push(function() {
      return params.outputName;
    });
  } else if (params.selectors && params.selectors.length) {
    groups.push(params.needsPeopleData ? 'event.name' : 'name');
  }

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
           quarterStart.setMonth(quarterStart.getMonth() + 3)) {
        quarterStarts.push(quarterStart.getTime());
      }
      timeUnitGroupBySelector = mixpanel.numeric_bucket(params.needsPeopleData ? 'event.time' : 'time', quarterStarts);
      params.dates.from = getStartOfQuarter(params.dates.from);
      break;
  }
  groups.push(timeUnitGroupBySelector);

  groups = [mixpanel.multiple_keys(groups)];

  var getReducerFunc = function(type, accessor) {
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

  var query;
  var queryParams = {
    from_date: params.dates.from,
    to_date: params.dates.to,
  };
  if (params.needsPeopleData) {
    query = join(Events(queryParams), People(), {selectors: params.selectors, type: 'left'});
  } else {
    queryParams.event_selectors = params.selectors;
    query = Events(queryParams);
  }

  var propertyPaths = ['value'];
  if (params.property) {
    propertyPaths = getPropertyPaths(params.property.name, params.property.resourceType);
    // TODO(chi): use mixpanel.to_number
    var accessNumericPropertyOrReturnDefaultValue = function(paths, defaultValue) {
      return function(eventData) {
        if (!eventData) {
          return defaultValue;
        }

        var prop = paths.reduce(function(prop, path) {
          return prop && prop[path];
        }, eventData);

        return _.isNumber(prop) ? prop : defaultValue;
      };
    };
    // TODO(chi): Have the accessor return any number for 'average' or 'median' when the property
    // isn't a number yields inaccurate result. The fundamental issue is what do do when a numeric
    // property of a user is non-existent or not numeric?
    var getAccessorFunc = function(type, paths) {
      switch (type) {
        case 'average':
        case 'max':
        case 'median':
        case 'total':
          return accessNumericPropertyOrReturnDefaultValue(paths, 0);
        case 'min':
          return accessNumericPropertyOrReturnDefaultValue(paths, Number.MAX_VALUE);
        default:
          throw new Error('Unsupported type in getAccessorFunc');
      }
    };
    if (params.property.resourceType === 'people') {
      propertyPaths = ['value'].concat(propertyPaths);
      query = query.groupByUser(groups, mixpanel.reducer.any())
        .groupBy([mixpanel.slice('key', 1)], getReducerFunc(params.type, getAccessorFunc(params.type, propertyPaths)));
    } else {
      query = query.groupBy(groups, getReducerFunc(params.type, getAccessorFunc(params.type, propertyPaths)));
    }
  } else if (params.type === 'total') {
    query = query.groupBy(groups, mixpanel.reducer.count({account_for_sampling: true}));
  } else if (params.type === 'unique') {
    query = query.groupByUser(groups, mixpanel.reducer.noop())
      .groupBy([mixpanel.slice('key', 1)], mixpanel.reducer.count());
  } else {
    query = query.groupByUser(groups, mixpanel.reducer.count({account_for_sampling: true}))
      .groupBy([mixpanel.slice('key', 1)], getReducerFunc(params.type));
  }
  if (!['total', 'unique'].includes(params.type)) {
    var getPostprocessFunc = function(type, paths) {
      var postprocessFunc;
      switch (type) {
        case 'average':
          postprocessFunc = function(item) {
            item.value = item.value.sum / item.value.count;
            return item;
          };
          break;
        case 'max':
        case 'min':
          postprocessFunc = function(item) {
            item.value = paths.reduce(function(prop, path) {
              return prop[path];
            }, item.value);
            return item;
          };
          break;
        case 'median':
          postprocessFunc = function(item) {
            item.value = item.value[0].value;
            return item;
          };
          break;
        default:
          throw new Error('Unsupported type in getAccessorFunc');
      }
      return postprocessFunc;
    };

    query = query.map(getPostprocessFunc(params.type, propertyPaths));
  }

  return query;
}

// ===== JQL CODE ENDS
// anything below this line will not be sent to the JQL backend

module.exports = main;
