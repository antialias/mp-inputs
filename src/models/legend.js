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

  isAnyDisplayExpanded() {
    return this.seriesShowing.some(displaySetting => displaySetting === 'expanded');
  }

  _seriesDisplaySetting(series) {
    return Object.keys(series.seriesData).length > 20 ? 'minimized' : 'all';
  }

  buildColorMap(numColors=8) {
    this._colorMap = {};
    let colorIdx = 0;
    const showingData = Object.keys(this.data[0].seriesData).filter(series => this.data[0].seriesData[series]);
    showingData.forEach(series => {
      this._colorMap[series] = this._colorMap[series] || (colorIdx++ % numColors) + 1;
    });
  }


  getSeriesDisplayAtIndex(seriesIdx) {
    return this.seriesShowing[seriesIdx] || null;
  }

  get colorMap() {
    this._colorMap = this._colorMap || {};
    return this._colorMap;
  }

  getColorForSeries(series) {
    return this._colorMap[series];
  }

  get seriesShowing() {
    if (!this._seriesShowing) {
      this._seriesShowing = this.data.map((series, idx) => idx === 0 ? this._seriesDisplaySetting(series) : 'hidden');
    }
    return this._seriesShowing;
  }

  set seriesShowing(value) {
    this._seriesShowing = value;
  }

  setDefaultSeriesShowing() {
    this._seriesShowing = null;
  }

  showAllSeries() {
    this.seriesShowing = this.seriesShowing.map(() => 'all');
  }

  isSeriesShowing(seriesIdx) {
    return this.seriesShowing[seriesIdx] !== 'hidden';
  }

  toggleShowSeries(seriesIdx) {
    if (this.seriesShowing && this.seriesShowing.length >= seriesIdx) {
      this.seriesShowing[seriesIdx] = this.isSeriesShowing(seriesIdx) ? 'hidden' : this._seriesDisplaySetting(this.data[seriesIdx]);
    }
  }

  toggleSeriesDisplaySetting(seriesIdx) {
    if (['minimized', 'expanded'].includes(this.seriesShowing[seriesIdx])) {
      const oldDisplaySetting = this.seriesShowing[seriesIdx];
      this.seriesShowing = this.seriesShowing.map(displaySetting => displaySetting === 'expanded' ? 'minimized' : displaySetting);
      this.seriesShowing[seriesIdx] = oldDisplaySetting === 'minimized' ? 'expanded' : 'minimized';
    }
  }

  update(attrs) {
    return Object.assign(this, attrs);
  }

  updateSeriesAtIndex(seriesIdx, attrs) {
    Object.assign(this.data[seriesIdx].seriesData, attrs);
    this.buildColorMap();
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

    this.buildColorMap();
    this.setDefaultSeriesShowing();
    return Object.assign(this, {data});
  }

  unselectedCount(seriesIdx) {
    return Object.values(this.data[seriesIdx].seriesData).filter(value => !value).length;
  }
}
