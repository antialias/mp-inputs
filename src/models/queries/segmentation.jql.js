/* global Events, mixpanel, module, params */

// parameterized JQL segmentation query
//
// sample params format:
// {
//   dates: {
//     from: '2016-05-04',
//     to: '2016-05-05',
//     unit: 'hour',
//   },
//   filters: [
//     {
//       operator: 'equals',
//       expected: ['Viewed report'],
//     },
//     {
//       prop: '$browser',
//       operator: 'equals',
//       expected: ['Chrome'],
//     },
//     {
//       prop: 'mp_country_code',
//       operator: 'is set',
//     },
//   ],
//   groups: [
//    '$browser',
//    'mp_country_code',
//    '$city',
//    'tab',
//   ],
// }

module.exports = function main() {
  function filterByParams(ev) {
    for (var filter of params.filters) {
      var actual = filter.prop ? ev.properties[filter.prop] : ev.name;
      switch(filter.operator) {
        case 'equals':
          if (!filter.expected.some(expectedVal => actual === expectedVal)) {
            return false;
          }
          break;
        case 'is false':
          if (actual) {
            return false;
          }
          break;
        case 'is not set':
          if (typeof actual !== 'undefined' && actual !== null) {
            return false;
          }
          break;
        case 'is set':
          if (typeof actual === 'undefined' || actual === null) {
            return false;
          }
          break;
        case 'is true':
          if (!actual) {
            return false;
          }
          break;
        default:
          throw `Unknown filter operator: "${filter.operator}"`;
      }
    }
    return true;
  }

  var groups = ['name'];
  if (params.groups) {
    groups = groups.concat(params.groups.map(function(group) { return 'properties.' + group; }));
  }
  switch(params.dates.unit) {
    case 'day':
      groups.push(function(ev) {
        return (new Date(ev.time)).toISOString().split('T')[0];
      });
      break;
    case 'hour':
      groups.push(function(ev) {
        var dateMatch = (new Date(ev.time)).toISOString().match(/(.+)T(\d\d):/);
        return `${dateMatch[1]} ${dateMatch[2]}:00:00`;
      });
      break;
  }

  var query = Events({from_date: params.dates.from, to_date: params.dates.to});
  if (params.filters) {
    query = query.filter(filterByParams);
  }
  if (groups.length) {
    query = query.groupBy(groups, mixpanel.reducer.count());
  } else {
    query = query.reduce(mixpanel.reducer.count());
  }
  return query;
};
