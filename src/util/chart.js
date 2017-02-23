import { mapValues } from 'mixpanel-common/util';

// From media/js/charts/chart.js.

// TODO
// Note that this just mirrors the existing segmentation logic, which both
// requires a customized version of Highcharts and fails to account for
// incomplete data in the past (e.g., 2016-12-01 through 2017-01-01 with
// monthly time unit will show data for only one day of January but a solid
// line).

// For future reference, IMO the right way to handle this is for
// isIncomplete to take a "to" date and a unit, and determine whether that
// "to" date is at the end of a unit boundary. There's also now a duplicate
// copy in mp-common, which is where these changes should happen.

// For avoiding a customized Highcharts, we could remove the last data
// point from an incomplete segment, and create a new segment with just the
// last two data points, linked to the prior segment and with different
// styling. This works right now in line chart, but fails in stacked line
// (though of course it seems to work in stacked line in the latest
// Highcharts).

/**
  * isIncompleteInterval -- Returns true if the last time-period has not been completed 
  *
  * @param {Hash} series A single series, in highcharts format
  * @param {Hash} an options hash.
  *      * (required) 'unit' interval in milliseconds
  *        OR A string describing the interval ('hour', 'day', 'week', 'month')
  *      * (required) 'utcOffset' timezone offset in minutes
  *        OR A string describing the interval ('hour', 'day', 'week', 'month')
  *      * "adjust_for_local_time" This adjusts the estimation for local time.
  * @return {Boolean} true/false
  */
export function isIncompleteInterval(data, options) {
  options = options || {};
  var unit = options.unit;
  if (data && data.length > 0 && unit !== undefined) {
    var timeInterval;
    var lastPoint = data[data.length - 1];
    var lastDate = Array.isArray(lastPoint) ? lastPoint[0] : lastPoint.x;
    var date = new Date();
    var currentDate = date.getTime();
    var timezoneOffset = options.utcOffset;
    if (options.adjust_for_local_time) {
      // many dates passed in are in the local time of the browser.
      timezoneOffset += date.getTimezoneOffset();
    }
    currentDate = currentDate + 60000 * timezoneOffset;

    var currentInterval = (currentDate - lastDate);

    if (Number.isInteger(unit)) {
      timeInterval = unit;
    } else {
      var hour = 60 * 60 * 1000;  // milliseconds in an hour

      switch (unit.toLowerCase()) {
        case `hour`:
          timeInterval = hour;
          break;
        case `day`:
          timeInterval = 24 * hour;
          break;
        case `week`:
          timeInterval = 7 * 24 * hour;
          break;
        case `month`:
          date = new Date(currentDate); // change date to account for offset
          var start = new Date(date.getYear(), date.getMonth());
          var end = new Date(date.getYear(), date.getMonth() + 1);
          timeInterval = (end.getTime() - start.getTime());
          break;
        case `quarter`:
          var now = new Date(currentDate);
          var last = new Date(lastDate);
          var nowMonths = now.getUTCFullYear() * 12 + now.getUTCMonth();
          var lastMonths = last.getUTCFullYear() * 12 + last.getUTCMonth();
          return nowMonths - lastMonths < 3;
        default:
          console.error(`Unknown interval: "${timeInterval}"`);
          return false;
      }
    }

    return currentInterval < timeInterval;
  } else {
    return false;
  }
}

/** 
 * Transpose rows to columns like an extra group by clause does
 * It is assumed that series has only 2 dimensions
 * @param {string[]} headers - Names for the different series in order of group by
 * @param {any} series - object with rowNames as properties and colNames as subProperties
 * @param {string} resourceDescription - e.g 'Total number of'
 * @returns {{headers: string[], series: any}} - Tuple of header and series with cols transposed
 */
export function transposeColsToRows(headers, series, resourceDescription) {
  if (headers.length !== 2) {
    throw new Error(`Expecting ${headers} to be of length 2`);
  }

  const newHeaders = [...headers, resourceDescription];
  const newSeries = mapValues(series, row => (
    mapValues(row, col => (
      {[resourceDescription]: col}
    ))
  ));

  return {headers:newHeaders, series:newSeries};
}
