import {
  sorted,
} from '../../../../util';

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
  const changeAttrs = [
    attrs.dataId,
    attrs.utcOffset,
    analysis,
    plotStyle,
    value,
    timeUnit,
    colorMapKey,
  ];
  const allAttributesExist = changeAttrs.every(attr => typeof attr !== `undefined` && attr !== null);
  return allAttributesExist ? changeAttrs.join(`-`) : null;
}
