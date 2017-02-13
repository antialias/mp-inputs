/* global Events, mixpanel, module, People, params, join*/
/* eslint camelcase:0, quotes:0 */

function main() {
  var query;

  var eventQueryParams = {
    from_date: params.from,
    to_date:   params.to,
  };

  switch (params.queryResourceType) {
    case 'all':
      query = join(Events(eventQueryParams), People(), {selectors: params.selectors, type: 'left'});
      break;
    case 'events':
      eventQueryParams.event_selectors = params.selectors;
      query = Events(eventQueryParams);
      break;
    case 'people':
      query = People({user_selectors: params.selectors});
      break;
  }

  var reducerMethod = mixpanel.reducer[params.task];
  var reducer = reducerMethod(mixpanel.to_number(params.propertyPath));

  return query.reduce(reducer);
}

// ===== JQL CODE ENDS
// anything below this line will not be sent to the JQL backend

module.exports = main;
