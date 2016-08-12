import {
  combineNestedObjKeys,
  nestedObjectSum,
  objectFromPairs,
  pick,
  uniqueObjKeysAtDepth,
} from '../util';

export default class Legend {
  constructor(attrs) {
    Object.assign(this, pick(attrs, ['data']));
  }

  update(attrs) {
    return Object.assign(this, attrs);
  }

  updateSeriesAtIndex(seriesIdx, attrs) {
    Object.assign(this.data[seriesIdx].seriesData, attrs);
    return this;
  }

  updateLegendData(result, defaultValue=true, showLimit=48) {
    const data = [];
    const segments = result.headers.slice();
    const sumNestedResults = nestedObjectSum(result.series);

    for (let i = segments.length - 1; i >= 0; i--) {
      let seriesName = segments[i];
      let seriesData = null;

      if (!data.length) {
        const completeSeriesTotals = combineNestedObjKeys(sumNestedResults);
        seriesData = objectFromPairs(
          Object.keys(completeSeriesTotals)
            .sort((a, b) => completeSeriesTotals[b] - completeSeriesTotals[a])
            .map((v, idx) => [v, !showLimit || (idx < showLimit) ? defaultValue : false])
        );
      } else {
        seriesData = objectFromPairs(uniqueObjKeysAtDepth(sumNestedResults, segments.length - i).map(v => [v, defaultValue]));
      }
      data.push({
        seriesData,
        seriesName,
      });
    }
    return Object.assign(this, {data});
  }

  unselectedCount() {
    return Object.values(this.data).filter(value => !value).length;
  }
}
