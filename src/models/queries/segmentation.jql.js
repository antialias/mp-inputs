/* global Events, People, join, mixpanel, module, params */
/* eslint camelcase:0, quotes:0 */

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
  var usesPeopleData = params.resourceTypeNeeded === 'all' || params.resourceTypeNeeded === 'people';
  var usesEventData = params.resourceTypeNeeded === 'all' || params.resourceTypeNeeded === 'events';

  if (params.outputName) {
    groups.push(function() {
      return params.outputName;
    });
  } else if (params.selectors && params.selectors.length) {
    groups.push(usesPeopleData ? 'event.name' : 'name');
  }

  var getPropertyPaths = function(propertyName, propertyResourceType) {
    var paths = [];
    if (params.resourceTypeNeeded === 'all') {
      paths.push(propertyResourceType === 'people' ? 'user' : 'event');
    }
    return paths.concat('properties', propertyName);
  };

  if (params.groups) {
    groups = groups.concat(params.groups.map(function(group) {
      var jqlGroup = getPropertyPaths(group.value, group.resourceType).join('.');
      if (group.buckets) {
        jqlGroup = mixpanel.numeric_bucket(jqlGroup, group.buckets);
      }
      return jqlGroup;
    }));
  }

  if (usesEventData) {
    if (params.dates.unit === 'all') {
      groups.push(function() {
        return 'all';
      });
    } else {
      // TODO (jordan): handle resetting dates when building params
      var bucketOptions = {
        hour: mixpanel.hourly_time_buckets,
        day: mixpanel.daily_time_buckets,
        week: mixpanel.weekly_time_buckets,
        month: mixpanel.monthly_time_buckets,
        quarter: mixpanel.quarterly_time_buckets,
      };
      groups.push(
        mixpanel.numeric_bucket(usesPeopleData ? 'event.time' : 'time', bucketOptions[params.dates.unit])
      );
    }
  }

  groups = [mixpanel.multiple_keys(groups)];

  var getReducerFunc = function(type, propertyPaths) {
    var accessor = propertyPaths ? mixpanel.to_number(propertyPaths.join('.')) : 'value';
    switch (type) {
      case 'average': return mixpanel.reducer.avg(accessor);
      case 'max'    : return mixpanel.reducer.max(accessor);
      case 'median' : return mixpanel.reducer.numeric_percentiles(accessor, 50);
      case 'min'    : return mixpanel.reducer.min(accessor);
      case 'total'  : return mixpanel.reducer.sum(accessor);
    }
  };

  var query;
  var queryParams = {
    from_date: params.dates && params.dates.from,
    to_date: params.dates && params.dates.to,
  };

  switch (params.resourceTypeNeeded) {
    case 'all':
      query = join(Events(queryParams), People(), {selectors: params.selectors, type: 'left'});
      break;
    case 'events':
      queryParams.event_selectors = params.selectors;
      query = Events(queryParams);
      break;
    case 'people':
      query = People({user_selectors: params.selectors});
      break;
  }

  var propertyPaths = ['value'];
  var countReducer = usesEventData ? mixpanel.reducer.count({account_for_sampling: true}) :  mixpanel.reducer.count();
  if (params.property) {
    var groupByKeys = groups;
    propertyPaths = getPropertyPaths(params.property.name, params.property.resourceType);
    if (params.property.resourceType === 'people') {
      propertyPaths = ['value'].concat(propertyPaths);
      groupByKeys = [mixpanel.slice('key', 1)];
      query = query.groupByUser(groups, mixpanel.reducer.any());
    }
    query = query.groupBy(groupByKeys, getReducerFunc(params.type, propertyPaths));
  } else if (params.type === 'total') {
    query = query.groupBy(groups, countReducer);
  } else if (params.type === 'unique') {
    query = query.groupByUser(groups, mixpanel.reducer.noop())
      .groupBy([mixpanel.slice('key', 1)], mixpanel.reducer.count());
  } else {
    query = query.groupByUser(groups, countReducer)
      .groupBy([mixpanel.slice('key', 1)], getReducerFunc(params.type));
  }
  return params.groupLimits ? query.internalLimitHierarchically(params.groupLimits) : query;
}

// ===== JQL CODE ENDS
// anything below this line will not be sent to the JQL backend

module.exports = main;
