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

  get seriesShowing() {
    if (!this._seriesShowing) {
      this._seriesShowing = this.data.map((_, idx) => !idx);
    }
    return this._seriesShowing;
  }

  setDefaultSeriesShowing() {
    this._seriesShowing = null;
  }

  showAllSeries() {
    this._seriesShowing = this._seriesShowing.map(() => true);
  }

  isSeriesShowing(seriesIdx) {
    return this.seriesShowing[seriesIdx];
  }

  toggleShowSeries(seriesIdx) {
    if (this.seriesShowing && this.seriesShowing.length >= seriesIdx) {
      this.seriesShowing[seriesIdx] = !this.seriesShowing[seriesIdx];
    }
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

  unselectedCount(seriesIdx) {
    return Object.values(this.data[seriesIdx].seriesData).filter(value => !value).length;
  }
}
