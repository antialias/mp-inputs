/* global Events, mixpanel, module, People, params*/
/* eslint camelcase:0 */

function main() {
  var query;

  if (params.isPeopleProperty) {
    query = People();
  } else {
    query = Events({
      event_selectors: params.events,
      from_date: params.from,
      to_date:   params.to,
    });
  }

  var reducerMethod = mixpanel.reducer[params.task];
  var reducer = reducerMethod(mixpanel.to_number(params.propertyPath));

  return query.reduce(reducer);
}

// ===== JQL CODE ENDS
// anything below this line will not be sent to the JQL backend

module.exports = main;
