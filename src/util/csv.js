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

function rowsForLeafKey(leafKey, data, keysAtDepth, depth, row) {
  const keys = keysAtDepth[depth];
  let allRows;
  if (depth > 1) {
    allRows = keys.reduce((rows, key) =>
      rows.concat(rowsForLeafKey(leafKey, data[key] || {}, keysAtDepth, depth - 1, row.concat(key))), []
    );
  } else {
    allRows = [row.concat(keys.map(key => {
      const dataForKey = data[key] || {};
      return dataForKey[leafKey] || 0;
    }))];
  }
  return allRows;
}

export function resultToCSVArray(data, {timeUnit=`day`, timeseries=true}={}) {
  const depth = nestedObjectDepth(data.series);
  const keysAtDepth = Array(depth).fill().map((__, level) =>
    nestedObjectKeys(data.series, level + 1).sort()
  );
  const dateKeys = keysAtDepth[0];
  const leafKeys = keysAtDepth[1];

  // prep headers
  const dataHeaders = data.headers
    .slice(0, data.headers.length - 1)
    .map(header =>
      header === `$event` ? `Event` : renameProperty(header)
    );
  const leafHeaders = leafKeys
    .map(header => renamePropertyValue(header));
  const csvHeaders = [
    `Date`,
    ...dataHeaders,
    ...leafHeaders,
  ];

  // rows
  const csvRows = dateKeys.reduce((rows, dateStr) =>
    rows.concat(rowsForLeafKey(
      dateStr, data.series, keysAtDepth, depth - 1, [formatCSVDate(dateStr, timeUnit)]
    )), []
  );

  return [
    csvHeaders,
    ...csvRows,
  ];
}

export function dataToCSV(data, options) {
  return resultToCSVArray(data, options)
    .map(row => row.join(`,`))
    .join(`\n`);
}
