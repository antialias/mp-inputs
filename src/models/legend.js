import {
  combineNestedObjKeys,
  flattenNestedObjectToPath,
  nestedObjectSum,
  pick,
  sorted,
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
        this._buildColorMap(`_flattenedColorMap`, Legend.FLAT_DATA, numColors);
      }
    }
    this.changeID++;
    return this;
  }

  getFlattenedFilters() {
    return (this.data && this.data[0]) ? this.data[0].flattenedData : {};
  }

  getSeriesDisplayAtIndex(seriesIdx) {
    return this.seriesShowing[seriesIdx] || null;
  }

  get colorMap() {
    if (!Object.keys(this._colorMap || {}).length) {
      this.buildColorMap();
    }
    return this._colorMap;
  }

  get flattenedColorMap() {
    return this._flattenedColorMap || {};
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

  numberOfFlattenedSegments() {
    return Object.keys(this.getFlattenedFilters()).length;
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

  updateSeriesAtIndex({dataType=this.SERIES_DATA, legendUpdate={}}) {
    this.changeID++;
    Object.keys(legendUpdate).forEach(seriesIdx => {
      Object.assign(this.data[seriesIdx][dataType], legendUpdate[seriesIdx]);
    });
    return this;
  }

  showAllLegendSeries(dataType) {
    this.changeID++;
    Object.keys(this.data).forEach(seriesIdx => {
      const series = this.data[seriesIdx][dataType] || [];
      Object.keys(series).forEach(key => series[key] = true);
    });
    return this;
  }

  _sortAndLimitSeries(series, defaultValue, showLimit, prevLegendData={}) {
    const sortedKeys = sorted(Object.keys(series), {
      order: `desc`,
      transform: item => series[item],
    });

    const defaultStates = sortedKeys.reduce((obj, key, idx) => {
      obj[key] = idx < showLimit ? defaultValue : false;
      if (prevLegendData.hasOwnProperty(key)) {
        obj[key] = prevLegendData[key];
      }
      return obj;
    }, {});
    return {sortedKeys, defaultStates};
  }

  updateLegendData(result, defaultValue=true) {
    const segments = result.headers.slice();
    let sumNestedResults = result.series;

    const prevSeriesHeaders = (this.data || []).map(series => series.seriesName);

    const data = segments.reverse().map((seriesName, idx) => {
      const dataSegment = {seriesName};
      let prevSeriesLegend = {};
      if (prevSeriesHeaders.includes(seriesName)) {
        prevSeriesLegend = this.data[prevSeriesHeaders.indexOf(seriesName)];
      }

      sumNestedResults = nestedObjectSum(sumNestedResults);
      dataSegment.combinedResults = combineNestedObjKeys(sumNestedResults);
      const seriesResults = this._sortAndLimitSeries(dataSegment.combinedResults, defaultValue, 24, prevSeriesLegend.seriesData);
      dataSegment.seriesData = seriesResults.defaultStates;

      if (!idx) {
        // Flattened Data for Line Chart
        const flattenHeaders = flattenNestedObjectToPath(result.dataForLineChart(), {flattenValues: true});
        const flatResults = this._sortAndLimitSeries(flattenHeaders.values, defaultValue, 20, prevSeriesLegend.flattenedData);

        Object.assign(dataSegment, {
          flattenedData: flatResults.defaultStates,
          flattenedDataPaths: flattenHeaders.paths,
          flattenedDataSortedKeys: flatResults.sortedKeys,
          seriesDataSortedKeys: seriesResults.sortedKeys,
        });
      }
      return dataSegment;
    });

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
