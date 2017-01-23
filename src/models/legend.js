import {
  combineNestedObjKeys,
  flattenNestedObjectToPath,
  nestedObjectSum,
  objectFromPairs,
  pick,
  sorted,
  uniqueObjKeysAtDepth,
} from '../util';

let legendID = 1;

export default class Legend {
  constructor(attrs) {
    Object.assign(this, pick(attrs, [`data`]));
    this.id = legendID++;
    this.changeID = 1;
  }

  get revisionStr() {
    return `${this.id}-${this.changeID}`;
  }

  isAnyDisplayExpanded() {
    return this.seriesShowing.some(displaySetting => displaySetting === `expanded`);
  }

  _seriesDisplaySetting(series) {
    return Object.keys(series.seriesData).length > 20 ? `minimized` : `all`;
  }

  _buildColorMap(mapName, dataType, numColors) {
    this[mapName] = {};
    if (this.data && this.data.length) {
      let colorIdx = 0;
      this.data[0][`${dataType}SortedKeys`]
        .forEach(series => {
          this[mapName][series] = this[mapName][series] || (colorIdx++ % numColors) + 1;
        });
    }
  }

  buildColorMap(numColors=8) {
    const data = this.data[0];
    if (data) {
      if (!data.flattenedData || !data.seriesData) {
        Object.assign(this.data[0], {
          flattenedData: {},
          flattenedDataPaths: {},
          flattenedDataSortedKeys: [],
          seriesDataSortedKeys: [],
        });
      } else {
        this._buildColorMap(`_colorMap`,  Legend.SERIES_DATA, numColors);
        this._buildColorMap(`_flattenedColorMap`, Legend.SERIES_DATA, numColors);
      }
    }
    this.changeID++;
    return this;
  }

  getSeriesDisplayAtIndex(seriesIdx) {
    return this.seriesShowing[seriesIdx] || null;
  }

  get colorMap() {
    this._colorMap = this._colorMap || {};
    return this._colorMap;
  }

  getColorForSeries(series, flattenedData=false) {
    return this[flattenedData ? `_flattenedColorMap` : `_colorMap`][series];
  }

  get seriesShowing() {
    if (!this._seriesShowing) {
      this._seriesShowing = this.data.map((series, idx) => idx === 0 ? this._seriesDisplaySetting(series) : `hidden`);
    }
    return this._seriesShowing;
  }

  set seriesShowing(value) {
    this.changeID++;
    this._seriesShowing = value;
  }

  setDefaultSeriesShowing() {
    this._seriesShowing = null;
    return this;
  }

  showAllSeries() {
    this.changeID++;
    this.seriesShowing = this.seriesShowing.map(() => `all`);
    return this;
  }

  isSeriesShowing(seriesIdx) {
    return this.seriesShowing[seriesIdx] !== `hidden`;
  }

  toggleShowSeries(seriesIdx) {
    if (this.seriesShowing && this.seriesShowing.length >= seriesIdx) {
      this.seriesShowing[seriesIdx] = this.isSeriesShowing(seriesIdx) ? `hidden` : this._seriesDisplaySetting(this.data[seriesIdx]);
      this.changeID++;
    }
    return this;
  }

  toggleSeriesDisplaySetting(seriesIdx) {
    if ([`minimized`, `expanded`].includes(this.seriesShowing[seriesIdx])) {
      const oldDisplaySetting = this.seriesShowing[seriesIdx];
      this.seriesShowing = this.seriesShowing.map(displaySetting => displaySetting === `expanded` ? `minimized` : displaySetting);
      this.seriesShowing[seriesIdx] = oldDisplaySetting === `minimized` ? `expanded` : `minimized`;
      this.changeID++;
    }
    return this;
  }

  update(attrs) {
    this.changeID++;
    return Object.assign(this, attrs);
  }

  updateSeriesAtIndex({dataType=this.SERIES_DATA, legendUpdate={}, setAllAncestorsToTrue=false}={}) {
    this.changeID++;
    if (setAllAncestorsToTrue) {
      const baseSeriesIdx = Math.max(...Object.keys(legendUpdate));
      const ancestorIdxToUpdate = Object.keys(this.data)
        .filter(seriesIdx => Number(seriesIdx) > baseSeriesIdx);

      ancestorIdxToUpdate.forEach(seriesIdx => {
        const series = this.data[seriesIdx][dataType];
        Object.keys(series).forEach(key => series[key] = true);
      });
    }
    Object.keys(legendUpdate).forEach(seriesIdx => {
      Object.assign(this.data[seriesIdx][dataType], legendUpdate[seriesIdx]);
    });
    return this;
  }

  _sortAndLimitSeries(series, defaultValue, showLimit) {
    const sortedKeys = sorted(Object.keys(series), {
      order: `desc`,
      transform: item => series[item],
    });
    const defaultStates = sortedKeys.reduce((obj, key, idx) => {
      obj[key] = idx < showLimit ? defaultValue : false;
      return obj;
    }, {});
    return {sortedKeys, defaultStates};
  }

  updateLegendData(result, defaultValue=true) {
    let data = [];
    const segments = result.headers.slice();
    const sumNestedResults = nestedObjectSum(result.series);

    for (let i = segments.length - 1; i >= 0; i--) {
      let seriesName = segments[i];
      const dataSegment = {seriesName};

      if (!data.length) {
        const resultsFlattened = flattenNestedObjectToPath(sumNestedResults);
        const flatResults = this._sortAndLimitSeries(resultsFlattened.values, defaultValue, 20); // Line Chart
        const seriesResults = this._sortAndLimitSeries(combineNestedObjKeys(sumNestedResults), defaultValue, 24); // Bar Chart
        Object.assign(dataSegment, {
          flattenedData: flatResults.defaultStates,
          flattenedDataPaths: resultsFlattened.paths,
          flattenedDataSortedKeys: flatResults.sortedKeys,
          seriesData: seriesResults.defaultStates,
          seriesDataSortedKeys: seriesResults.sortedKeys,
        });
      } else {
        dataSegment.seriesData = objectFromPairs(uniqueObjKeysAtDepth(sumNestedResults, segments.length - i).map(v => [v, defaultValue]));
      }
      data.push(dataSegment);
    }

    return Object.assign(this, {data})
      .buildColorMap()
      .setDefaultSeriesShowing();
  }

  unselectedCount(seriesIdx, dataType) {
    return Object.values(this.data[seriesIdx][dataType]).filter(value => !value).length;
  }
}

Legend.SERIES_DATA = Legend.prototype.SERIES_DATA = `seriesData`;
Legend.FLAT_DATA = Legend.prototype.FLAT_DATA = `flattenedData`;
