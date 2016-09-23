import {
  combineNestedObjKeys,
  flattenNestedDict,
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

  _buildColorMap(mapName, data, numColors) {
    this[mapName] = {};
    if (data) {
      let colorIdx = 0;
      Object.keys(data)
        .filter(series => data[series])
        .forEach(series => {
          this[mapName][series] = this[mapName][series] || (colorIdx++ % numColors) + 1;
        });
    }
  }

  buildColorMap(numColors=8) {
    this._buildColorMap('_colorMap', this.data[0].seriesData, numColors);
    this._buildColorMap('_flattenedColorMap', this.data[0].flattenedData, numColors);
  }

  getSeriesDisplayAtIndex(seriesIdx) {
    return this.seriesShowing[seriesIdx] || null;
  }

  get colorMap() {
    this._colorMap = this._colorMap || {};
    return this._colorMap;
  }

  getColorForSeries(series, flattenedData=false) {
    return this[flattenedData ? '_flattenedColorMap' : '_colorMap'][series];
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

  updateSeriesAtIndex(seriesIdx, dataKey, attrs) {
    Object.assign(this.data[seriesIdx][dataKey], attrs);
    this.buildColorMap();
    return this;
  }

  _sortAndLimitSeries(series, defaultValue, showLimit) {
    return objectFromPairs(
      Object.keys(series)
        .sort((a, b) => {
          if (typeof a === 'object' && typeof b === 'object') {
            return b.value - a.value;
          }
          return series[b] - series[a];
        })
        .map((v, idx) => [v, !showLimit || (idx < showLimit) ? defaultValue : false])
    );
  }

  updateLegendData(result, defaultValue=true, showLimit=48) {
    let data = [];
    const segments = result.headers.slice();
    const sumNestedResults = nestedObjectSum(result.series);

    for (let i = segments.length - 1; i >= 0; i--) {
      let seriesName = segments[i];

      if (!data.length) {
        data.push({
          flattenedData: this._sortAndLimitSeries(flattenNestedDict(sumNestedResults), defaultValue, showLimit),
          seriesData: this._sortAndLimitSeries(combineNestedObjKeys(sumNestedResults), defaultValue, showLimit),
          seriesName,
        });
      } else {
        data.push({
          seriesData: objectFromPairs(uniqueObjKeysAtDepth(sumNestedResults, segments.length - i).map(v => [v, defaultValue])),
          seriesName,
        });
      }
    }

    this.buildColorMap();
    this.setDefaultSeriesShowing();
    return Object.assign(this, {data});
  }

  unselectedCount(seriesIdx, dataKey) {
    return Object.values(this.data[seriesIdx][dataKey]).filter(value => !value).length;
  }
}
