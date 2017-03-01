/* global $ */
import { sorted } from '../util';

/**
 * https://github.com/mixpanel/mixpanel-platform/blob/d171a3ec/js/ui/chart.js#L38-L54
 * this function is a hack because highcharts insists on showing a
 * gridline for the 0th label on the y-axis, which conflicts with
 * the x-axis
 */
export function killLastGridline() {
  const gridlines = $(`.highcharts-grid path`, this.container).show()
    .map(function(gridline) {
      const $gridline = $(gridline);
      const offset = $gridline.offset();
      return [$gridline, (offset && offset.top) || 0];
    })
    .sort((a, b) => a[1] - b[1]);
  const line = gridlines[gridlines.length - 1];
  if (line && line[0] && line[0].hide) {
    line[0].hide();
  }
}

/**
 * Convert a chart data object with timestamps and counts into a list of objects
 * with the timestamps sorted as arrays for Highcharts.
 * @param {Object} chartData - An object of the flattened segments.
 * The key of each segment value is an object of timestamps and counts for those timestamps
 * @returns {[{name: segmentName, data: [sortedSegmentData] }]} - a list of objects that contain the segmentName and sorted timestamps with counts.
 */
export function dataObjectToSortedSeries(chartData) {
  return Object.entries(chartData).map(([name, counts]) => {
    const data = sorted(Object.keys(counts), {transform: Number})
      .map(timestamp => [Number(timestamp), counts[timestamp]]);
    return {data, name};
  });
}

/**
 * creates a unique ID that determines if a chart render should happen.
 * Any attribute that should cause a render should go through here.
 * Only renders if ALL attributes are not null or undefined (falsey values allowed)
 */
export function generateChangeId(attrs={}) {
  const {analysis, plotStyle, value, timeUnit} = attrs.displayOptions || {};
  const colorMapKey = attrs.segmentColorMap ? !!attrs.segmentColorMap : attrs.segmentColorMap;
  const headers = attrs.headers ? !!attrs.headers : attrs.headers;
  const changeAttrs = [
    attrs.dataId,
    attrs.utcOffset,
    analysis,
    colorMapKey,
    headers,
    plotStyle,
    timeUnit,
    value,
  ];
  const allAttributesExist = changeAttrs.every(attr => typeof attr !== `undefined` || attr !== null);
  return allAttributesExist ? changeAttrs.join(`-`) : null;
}
