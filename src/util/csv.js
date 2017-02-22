import { csvFormatRows } from 'd3-dsv';
import moment from 'moment';
import {
  renameProperty,
  renamePropertyValue,
} from 'mixpanel-common/report/util';
import {
  nestedObjectDepth,
  nestedObjectKeys,
} from 'mixpanel-common/util';

import { parseDate } from './time';


const CSV_TIME_FORMAT = {
  hour:    `YYYY-MM-DD HH:mm:ss`,
  day:     `YYYY-MM-DD`,
  week:    `YYYY-MM-DD`,
  month:   `YYYY-MM`,
  quarter: `YYYY [Q]Q`,
  year:    `YYYY`,
};
function formatCSVDate(dateStr, timeUnit) {
  return moment(parseDate(dateStr)).format(CSV_TIME_FORMAT[timeUnit]);
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
  return SPECIAL_NAMES[key] || renamePropertyValue(renameProperty(key));
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

export function resultToCSVArray(data, {timeUnit=`day`}={}) {
  let headers, series;
  if (data.peopleTimeSeries) {
    headers = data.headers.slice(1);
    series = data.peopleTimeSeries;
  } else {
    headers = data.headers.slice(0, data.headers.length - 1);
    series = data.series;
  }

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
