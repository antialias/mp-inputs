import { combineNestedObjKeys, nestedObjectSum, objectFromPairs, pick  } from '../util';

export default class Legend {
  constructor(attrs) {
    Object.assign(this, pick(attrs, ['currentSeries', 'data', 'search']));
  }

  updateLegendData(result, defaultValue=true, showLimit=48) {
    const seriesSums = combineNestedObjKeys(nestedObjectSum(result.series));
    return Object.assign(this, {
      data: objectFromPairs(
        Object.keys(seriesSums)
          .sort((a, b) => seriesSums[b] - seriesSums[a])
          .map((v, idx) => [v, (idx < showLimit) ? defaultValue : false])
      ),
      currentSeries: result.headers[result.headers.length-1] || null,
    });
  }

  unselectedCount() {
    return Object.values(this.data).filter(value => !value).length;
  }
}
