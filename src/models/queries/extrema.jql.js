/* global Events, join, mixpanel, module, People, params*/
/* eslint camelcase:0 */

function main() {
  var query;
  var queryParams = {
    from_date: params.from,
    to_date:   params.to,
  };

  if (params.isPeopleProperty) {
    query = join(Events(queryParams), People(), {selectors: params.selectors, type: `left`});
  } else {
    queryParams.event_selectors = params.events;
    query = Events(queryParams);
  }

  var reducerMethod;
  switch(params.task) {
    case `max`:
      reducerMethod = mixpanel.reducer.max;
      break;
    case `min`:
      reducerMethod = mixpanel.reducer.min;
      break;
  }

  var reducer = reducerMethod(mixpanel.to_number(params.propertyPath));

  return query.reduce(reducer);
}

// ===== JQL CODE ENDS
// anything below this line will not be sent to the JQL backend

module.exports = main;
