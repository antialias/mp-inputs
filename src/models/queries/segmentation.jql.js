/* global Events, People, join, module, params, _*/

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

function main() {
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
      return actual >= expected[0] && actual <= expected[1];
    };
    var equalNum = function(actual, expected) {
      return actual === expected;
    };
    var greaterThan = function(actual, expected) {
      return actual > expected;
    };
    var lessThan = function(actual, expected) {
      return actual < expected;
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
    var filterByParams = function(eventData) {
      for (var filter of params.filters) {
        var filterData = eventData;
        if (eventData.event) {
          filterData = filter.resourceType === 'people' ? eventData.user : eventData.event;
        }
        var filterTest = filterTests[filter.operator];
        if (!filterTest) {
          throw `Unknown filter operator: "${filter.operator}"`;
        }
        if (!filterData || !filterTest(filter.prop ? filterData.properties[filter.prop] : filterData.name, filter.expected)) {
          return false;
        }
      }
      return true;
    };
  }

  var groups = [];
  if (params.outputName) {
    groups.push(function() {
      return params.outputName;
    });
  } else if (params.events && params.events.length) {
    groups = groups.concat(function(eventData) {
      return eventData.event ? eventData.event.name : eventData.name
    });
  }

  var needsPeopleData = params.filters.concat(params.groups).some(function(param) {
    return param.resourceType === 'people'
  });

  if (params.groups) {
    groups = groups.concat(params.groups.map(function(group) {
      var sections = [];
      if (needsPeopleData) {
        sections.push(group.resourceType === 'people' ? 'user' : 'event');
      }
      return sections.concat('properties', group.value).join('.');
    }));
  }
  var timeUnitGroupByFuncs = {
    day: function(eventData) {
      eventData = eventData.event || eventData;
      return (new Date(eventData.time)).toISOString().split('T')[0];
    },
    hour: function(eventData) {
      eventData = eventData.event || eventData;
      var dateMatch = (new Date(eventData.time)).toISOString().match(/(.+)T(\d\d):/);
      return `${dateMatch[1]} ${dateMatch[2]}:00:00`;
    },
    // 'all' is a special group for entire time range in order for different query results to have
    // same depth, consistent for front end to process.
    all: function() {
      return 'all';
    },
  };

  groups.push(timeUnitGroupByFuncs[params.dates.unit]);

  var countWithSampling = function(counts, events) {
    var count = 0;
    for (var i = 0; i < events.length; i++) {
      var ev = events[i].event || events[i];
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

  var query = Events({
    event_selectors: params.events,
    from_date: params.dates.from,
    to_date: params.dates.to,
  });

  if (needsPeopleData) {
    query = join(query, People()).filter(function(tuple) { return tuple.event; });
  }

  if (params.filters && params.filters.length) {
    query = query.filter(filterByParams);
  }
  if (params.type === 'total') {
    query = query.groupBy(groups, countWithSampling);
  } else {
    var sliceOffDistinctId = function(row) {
      return row.key.slice(1);
    };
    if (params.type === 'unique') {
      query = query.groupByUser(groups, function() {return 1;})
        .groupBy([sliceOffDistinctId], countWithSampling);
    } else {
      var operatorFuncs = {
        average: function(list) {
          return list.reduce(function(prev, curr) {return prev + curr;}) / list.length;
        },
        median: function(list) {
          var median;
          list = list.sort();
          var length = list.length;
          if (length % 2 === 0) {
            median = (list[length / 2 - 1] + list[length / 2]) / 2;
          } else {
            median = list[(length - 1) / 2];
          }
          return median;
        },
      };

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

      var toList = function(accumulators, items) {
        var output = items.map(item => item.value);
        _.each(accumulators, function(a) {
          _.each(a, function(item) {
            output.push(item);
          });
        });
        return output;
      };

      query = query.groupByUser(groups, countWithSamplingForGroupByUser)
        .groupBy([sliceOffDistinctId], toList)
        .map(function(item) {
          item.value = operatorFuncs[params.type](item.value);
          return item;
        });
    }
  }
  return query;
}

// ===== JQL CODE ENDS
// anything below this line will not be sent to the JQL backend

module.exports = main;
