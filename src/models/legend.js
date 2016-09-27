import {
  combineNestedObjKeys,
  flattenNestedDict,
  nestedObjectSum,
  objectFromPairs,
  pick,
  sorted,
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

  _buildColorMap(mapName, dataKey, numColors) {
    this[mapName] = {};
    if (this.data && this.data.length) {
      let colorIdx = 0;
      this.data[0][`${dataKey}SortedKeys`]
        .filter(series => this.data[0][dataKey][series])
        .forEach(series => {
          this[mapName][series] = this[mapName][series] || (colorIdx++ % numColors) + 1;
        });
    }
  }

  buildColorMap(numColors=8) {
    const data = this.data[0];
    if (data){
      if (!data.flattenedData || !data.seriesData) {
        Object.assign(this.data[0], {
          flattenedData: {},
          flattenedDataPaths: {},
          flattenedDataSortedKeys: [],
          seriesDataSortedKeys: [],
        });
      } else {
        this._buildColorMap('_colorMap',  this.dataKeyForSeriesData, numColors);
        this._buildColorMap('_flattenedColorMap', this.dataKeyForFlatData, numColors);
      }
    }
    return this;
  }

  getSeriesDisplayAtIndex(seriesIdx) {
    return this.seriesShowing[seriesIdx] || null;
  }

  get colorMap() {
    this._colorMap = this._colorMap || {};
    return this._colorMap;
  }

  get dataKeyForSeriesData() {
    return 'seriesData';
  }

  get dataKeyForFlatData() {
    return 'flattenedData';
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
    return this;
  }

  showAllSeries() {
    this.seriesShowing = this.seriesShowing.map(() => 'all');
    return this;
  }

  isSeriesShowing(seriesIdx) {
    return this.seriesShowing[seriesIdx] !== 'hidden';
  }

  toggleShowSeries(seriesIdx) {
    if (this.seriesShowing && this.seriesShowing.length >= seriesIdx) {
      this.seriesShowing[seriesIdx] = this.isSeriesShowing(seriesIdx) ? 'hidden' : this._seriesDisplaySetting(this.data[seriesIdx]);
    }
    return this;
  }

  toggleSeriesDisplaySetting(seriesIdx) {
    if (['minimized', 'expanded'].includes(this.seriesShowing[seriesIdx])) {
      const oldDisplaySetting = this.seriesShowing[seriesIdx];
      this.seriesShowing = this.seriesShowing.map(displaySetting => displaySetting === 'expanded' ? 'minimized' : displaySetting);
      this.seriesShowing[seriesIdx] = oldDisplaySetting === 'minimized' ? 'expanded' : 'minimized';
    }
    return this;
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
    const sortedKeys = sorted(Object.keys(series), {
      order: 'desc',
      transform: item => series[item],
    });
    return [
      sortedKeys,
      sortedKeys.reduce((obj, key, idx) => {
        obj[key] = idx < showLimit ? defaultValue : false;
        return obj;
      }, {}),
    ];
  }

  updateLegendData(result, defaultValue=true, showLimit=48) {
    let data = [];
    const segments = result.headers.slice();
    const sumNestedResults = nestedObjectSum(result.series);

    for (let i = segments.length - 1; i >= 0; i--) {
      let seriesName = segments[i];
      const dataSegment = {seriesName};

      if (!data.length) {
        const resultsFlattened = flattenNestedDict(sumNestedResults);
        dataSegment.flattenedDataPaths = resultsFlattened.paths;
        [ dataSegment.flattenedDataSortedKeys, dataSegment.flattenedData ] = this._sortAndLimitSeries(
          resultsFlattened.values,
          defaultValue,
          showLimit
        );
        [ dataSegment.seriesDataSortedKeys, dataSegment.seriesData ] = this._sortAndLimitSeries(
          combineNestedObjKeys(sumNestedResults),
          defaultValue,
          showLimit
        );
      } else {
        dataSegment.seriesData = objectFromPairs(uniqueObjKeysAtDepth(sumNestedResults, segments.length - i).map(v => [v, defaultValue]));
      }
      data.push(dataSegment);
    }

    return Object.assign(this, {data})
      .buildColorMap()
      .setDefaultSeriesShowing();
  }

  unselectedCount(seriesIdx, dataKey) {
    return Object.values(this.data[seriesIdx][dataKey]).filter(value => !value).length;
  }
}
