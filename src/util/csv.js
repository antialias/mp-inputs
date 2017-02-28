import {csvFormatRows} from 'd3-dsv';
import moment from 'moment';
import {
  renameProperty,
  renamePropertyValue,
} from 'mixpanel-common/report/util';
import {
  nestedObjectDepth,
  nestedObjectKeys,
} from 'mixpanel-common/util';

import {parseDate} from './index';
import {transposeColsToRows} from './chart';

const CSV_TIME_FORMAT = {
  hour:    `YYYY-MM-DD HH:mm:ss`,
  day:     `YYYY-MM-DD`,
  week:    `YYYY-MM-DD`,
  month:   `YYYY-MM`,
  quarter: `YYYY [Q]Q`,
  year:    `YYYY`,
};
function formatCSVDate(dateStr, timeUnit) {
  return moment.utc(parseDate(dateStr, {iso: true})).format(CSV_TIME_FORMAT[timeUnit]);
}

const SPECIAL_NAMES = {
  /* eslint-disable camelcase */
  $all_people:   `All People`,
  $country_code: `Country`,
  $event:        `Event`,
  $people:       `People`,
  /* eslint-enable camelcase */
};
function renameKey(key) {
  return SPECIAL_NAMES[key] || renameProperty(key);
}

function rowsForLeafKey(leafKey, data, keysAtDepth, depth, row) {
  const keys = keysAtDepth[depth];
  let allRows;
  if (depth > 1) {
    allRows = keys.reduce((rows, key) =>
      rows.concat(rowsForLeafKey(leafKey, data[key] || {}, keysAtDepth, depth - 1, row.concat(renameKey(key)))), []
    );
  } else {
    allRows = [row.concat(keys.map(key => {
      const dataForKey = data[key] || {};
      return dataForKey[leafKey] || 0;
    }))];
  }
  return allRows;
}

/**
 * Recursively renames property names in a nested series based on headers
 * @param {string[]} headers - e.g ['$country_code', '$event']
 * @param {any} series - e.g {US: {$top_events: 200}}
 * @returns {any} - e.g {'United States': {'Your Top Events': 200}}
 */
function renameSeriesPropertyNames(headers, series) {
  if (headers.length) {
    const [propertyName, ...leafHeaders] = headers;
    const renamedSeries = {};

    Object.keys(series).forEach(key => {
      renamedSeries[renamePropertyValue(key, propertyName)] = renameSeriesPropertyNames(leafHeaders, series[key]);
    });
    
    return renamedSeries;
  }
  return series;
}

export function resultToCSVArray(data, {timeUnit=`day`}={}) {
  let headers, series;
  if (data.peopleTimeSeries) {
    headers = data.headers.slice(1);
    series = data.peopleTimeSeries;
  } else {
    headers = data.headers.slice(0, data.headers.length - 1);
    series = data.series;
  }

  // If series is a true table and only contain one row but many columns
  // Then transpose the cols to rows
  if (!data.peopleTimeSeries && data.headers.length === 2) {
    const rowLabels = Object.keys(series);
    if (rowLabels.length === 1) {
      const colLabels = Object.keys(series[rowLabels[0]]);
      if (colLabels.length > 1) {
        ({headers, series} = transposeColsToRows(data.headers, series, `Total number of`, /* addLeafHeader: */false));
      }
    }
  }

  series = renameSeriesPropertyNames(data.headers, series);
  const depth = nestedObjectDepth(series);
  const keysAtDepth = Array(depth).fill().map((__, level) =>
    nestedObjectKeys(series, level + 1).sort()
  );
  const dateKeys = keysAtDepth[0];
  const leafKeys = keysAtDepth[1];

  // headers
  const dataHeaders = headers.map(renameKey);
  const leafHeaders = data.peopleTimeSeries ? [] : leafKeys.map(renameKey);
  const csvHeaders = [
    `Date`,
    ...dataHeaders,
    ...leafHeaders,
  ];

  // rows
  const csvRows = dateKeys.reduce((rows, dateStr) =>
    rows.concat(rowsForLeafKey(
      dateStr, series, keysAtDepth, depth - 1, [formatCSVDate(dateStr, timeUnit)]
    )), []
  );

  // combined output
  let csvArray = [
    csvHeaders,
    ...csvRows,
  ];
  if (csvRows.every(row => row[0] === `Invalid date`)) {
    // cut off date column
    csvArray = csvArray.map(row => row.slice(1));
  }

  return csvArray;
}

export function dataToCSV(data, options) {
  return csvFormatRows(resultToCSVArray(data, options));
}
