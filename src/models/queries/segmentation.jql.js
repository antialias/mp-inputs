/* global Events, module, params */

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
  if (params.filters && params.filters.length) {
    // String
    var stringContains = function(actual, expected) {
      return String(actual).toLowerCase().indexOf(expected.toLowerCase()) !== -1;
    };
    var stringEquals = function(actual, expectedList) {
      actual = String(actual).toLowerCase();
      return expectedList.some(function(expectedVal) { return actual === String(expectedVal).toLowerCase(); });
    };
    var isSet = function(actual) {
      return typeof actual !== 'undefined' && actual !== null;
    };

    // Integer / Date
    var between = function(actual, expected) {
      return typeof actual === 'number' && actual > expected[0] && actual < expected[1];
    };
    var betweenIncl = function(actual, expected) {
      return typeof actual === 'number' && actual >= expected[0] && actual <= expected[1];
    };
    var equalNum = function(actual, expected) {
      return actual === expected;
    };
    var greaterThan = function(actual, expected) {
      return typeof actual === 'number' && actual > expected;
    };
    var lessThan = function(actual, expected) {
      return typeof actual === 'number' && actual < expected;
    };

    // Boolean
    var isTruthy = function(actual) {
      return !!actual;
    };

    // List
    var listContains = function(actual, expected) {
      return actual && actual.indexOf && actual.map(a => String(a)).indexOf(String(expected)) !== -1;
    };

    var negate = f => (...args) => !f(...args);
    var filterTests = {
      'contains':              stringContains,
      'does not contain':      negate(stringContains),
      'equals':                stringEquals,
      'does not equal':        negate(stringEquals),
      'is set':                isSet,
      'is not set':            negate(isSet),

      'is between':            between,
      'is equal to':           equalNum,
      'is greater than':       greaterThan,
      'is less than':          lessThan,

      'was between':           betweenIncl,
      'was less than':         greaterThan,
      'was more than':         lessThan,

      'is true':               isTruthy,
      'is false':              negate(isTruthy),

      'list contains':         listContains,
      'list does not contain': negate(listContains),
    };
    var filterByParams = function(ev) {
      for (var filter of params.filters) {
        var filterTest = filterTests[filter.operator];
        if (!filterTest) {
          throw `Unknown filter operator: "${filter.operator}"`;
        }
        if (!filterTest(filter.prop ? ev.properties[filter.prop] : ev.name, filter.expected)) {
          return false;
        }
      }
      return true;
    };
  }

  var groups = [];
  // Don't segments on 'name' for the special case 'all events'
  if (params.events && params.events.length) {
    groups.push('name');
  }
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

  var countWithSampling = function(counts, events) {
    var count = 0;
    for (var i = 0; i < events.length; i++) {
      var ev = events[i];
      if (ev.sampling_factor === 1.0) {
        count++;
      } else {
        count += 1.0 / ev.sampling_factor;
      }
    }
    for (i = 0; i < counts.length; i++) {
      count += counts[i];
    }
    return Math.round(count);
  };

  var query = Events({
    event_selectors: params.events,
    from_date: params.dates.from,
    to_date: params.dates.to,
  });
  if (params.filters && params.filters.length) {
    query = query.filter(filterByParams);
  }
  if (groups.length) {
    query = query.groupBy(groups, countWithSampling);
  } else {
    query = query.reduce(countWithSampling);
  }
  return query;
};
