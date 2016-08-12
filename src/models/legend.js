import { combineNestedObjKeys, nestedObjectSum, objectFromPairs, pick  } from '../util';

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
    let nsum = nestedObjectSum(result.series);

    while (segments.length) {
      let seriesName = segments.pop();
      let seriesData = null;
      if (!data.length) {
        const seriesSums = combineNestedObjKeys(nsum);
        seriesData = objectFromPairs(
          Object.keys(seriesSums)
            .sort((a, b) => seriesSums[b] - seriesSums[a])
            .map((v, idx) => [v, !showLimit || (idx < showLimit) ? defaultValue : false])
        );
      } else {
        nsum = nestedObjectSum(nsum);
        seriesData = objectFromPairs(Object.keys(nsum).map(v => [v, defaultValue]));
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
