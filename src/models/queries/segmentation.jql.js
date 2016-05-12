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
//   events: [
//     {
//       event: 'Viewed report',
//     },
//   ],
//   filters: [
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
  if (params.filters) {
    var between = function(actual, expected) {
      return typeof actual === 'number' && actual > expected[0] && actual < expected[1];
    };
    var contains = function(actual, expected) {
      return String(actual).toLowerCase().indexOf(expected.toLowerCase()) !== -1;
    };
    var equalNum = function(actual, expected) {
      return actual === expected;
    };
    var equals = function(actual, expectedList) {
      actual = String(actual).toLowerCase();
      return expectedList.some(function(expectedVal) { return actual === String(expectedVal).toLowerCase(); });
    };
    var greaterThan = function(actual, expected) {
      return typeof actual === 'number' && actual > expected;
    };
    var isSet = function(actual) {
      return typeof actual !== 'undefined' && actual !== null;
    };
    var isTruthy = function(actual) {
      return !!actual;
    };
    var lessThan = function(actual, expected) {
      return typeof actual === 'number' && actual < expected;
    };
    var filterTests = {
      'contains':         [contains,    true ],
      'does not contain': [contains,    false],
      'does not equal':   [equals,      false],
      'equals':           [equals,      true ],
      'is between':       [between,     true ],
      'is equal to':      [equalNum,    true ],
      'is false':         [isTruthy,    false],
      'is greater than':  [greaterThan, true ],
      'is less than':     [lessThan,    true ],
      'is not set':       [isSet,       false],
      'is set':           [isSet,       true ],
      'is true':          [isTruthy,    true ],
    };
    var filterByParams = function(ev) {
      for (var filter of params.filters) {
        var filterTest = filterTests[filter.operator];
        if (!filterTest) {
          throw `Unknown filter operator: "${filter.operator}"`;
        }
        if (filterTest[0](filter.prop ? ev.properties[filter.prop] : ev.name, filter.expected) !== filterTest[1]) {
          return false;
        }
      }
      return true;
    };
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

  var query = Events({
    event_selectors: params.events,
    from_date: params.dates.from,
    to_date: params.dates.to,
  });
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
