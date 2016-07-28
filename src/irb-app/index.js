import MPApp from 'mixpanel-common/report/mp-app';
import { extend, pick } from 'mixpanel-common/util';
import * as util from '../util';

import BuilderSections from '../models/builder-sections';
import { ShowSection, TimeSection } from '../models/section';
import { Clause, ShowClause, TimeClause } from '../models/clause';
import TopEventsQuery from '../models/queries/top-events';
import { TopEventPropertiesQuery, TopPeoplePropertiesQuery } from '../models/queries/top-properties';
import { TopEventPropertyValuesQuery, TopPeoplePropertyValuesQuery } from '../models/queries/top-property-values';
import SegmentationQuery from '../models/queries/segmentation';
import QueryCache from '../models/queries/query-cache';
import Report from '../models/report';
import Result from '../models/result';
import { nestedObjectCumulative, nestedObjectRolling, ROLLING_WINDOWS_BY_UNIT } from './irb-result/chart-util';

import './irb-header';
import './irb-builder';
import './irb-result';

import template from './index.jade';
import './index.styl';

const MINUTE_MS = 1000 * 60;

document.registerElement('irb-app', class IRBApp extends MPApp {
  get config() {
    return {
      defaultState: extend(
        this.resettableState,
        {
          // The following states should persist through reset.
          savedReports: [],
          util,
        }
      ),

      routes: {
        'report/:reportId': this.routeHandlers.load,
        '':                 this.routeHandlers.index,
      },

      template,
    };
  }

  get routeHandlers() {
    return (this._routeHandlers = this._routeHandlers || {

      load: (stateUpdate={}, reportId) => {
        const report = this.state.savedReports && this.state.savedReports[Number(reportId)];
        if (!report) {
          return this.navigate('');
        } else {
          if (!stateUpdate.report) {
            stateUpdate = extend(stateUpdate, this.loadReport(report));
          }
          return stateUpdate;
        }
      },

      index: (stateUpdate={}) => {
        if (this.state.report.id) {
          stateUpdate = extend(stateUpdate, this.resetQuery());
        } else {
          if (!stateUpdate.report) {
            this.resetTopQueries();
          }
        }
        return stateUpdate;
      },

    });
  }

  // The following states should be reset.
  get resettableState() {
    return {
      report: new Report({
        displayOptions: {
          chartType: 'bar',
          plotStyle: 'standard',
          analysis: 'linear',
          value: 'absolute',
        },
        sections: new BuilderSections({
          show: new ShowSection(new ShowClause({value: ShowClause.TOP_EVENTS})),
          time: new TimeSection(new TimeClause({range: TimeClause.RANGES.HOURS})),
        }),
        series: {
          currentSeries: null,
          data: {},
          isEditing: false,
          search: null,
        },
        sorting: this.sortConfigFor(null),
        title: 'Untitled report',
      }),

      chartToggle: {
        editingType: null,
        bar: {
          plotStyle: 'standard',
        },
        line: {
          plotStyle: 'standard',
        },
        table: {
          plotStyle: 'standard',
        },
      },
      isEditingExtrasMenu: false,
      newCachedData: false,
      resourceTypeFilter: 'all',
      result: new Result({
        headers: [],
        series: {},
      }),
      resultLoading: true,
      stageClauses: [],
      topEvents: [],
      topEventProperties: [],
      topPeopleProperties: [],
      topPropertyValues: [],
    };
  }

  attachedCallback() {
    this.customEvents = (this.parentData && this.parentData.custom_events) || [];
    if (this.parentData) {
      // don't start persisting yet
      Object.assign(this.state, {
        savedReports: this.parentData.bookmarks.reduce(
          (reports, bm) => extend(reports, {[bm.id]: Report.fromBookmarkData(bm)}),
          {}
        ),
      });
    }

    this.queries = {
      topEvents: new TopEventsQuery(),
      topEventProperties: new TopEventPropertiesQuery(),
      topEventPropertyValues: new TopEventPropertyValuesQuery(),
      topPeopleProperties: new TopPeoplePropertiesQuery(),
      topPeoplePropertyValues: new TopPeoplePropertyValuesQuery(),
      topPropertyValuesCache: new QueryCache(),
      segmentation: new SegmentationQuery(this.customEvents),
      segmentationCache: new QueryCache(),
    };

    // cache for different analysis choices
    this.analysisCache = {};

    super.attachedCallback(...arguments);

    if (this.state.report.id) {
      this.navigate(`report/${this.state.report.id}`);
    }
  }

  // Serialization helpers

  get persistenceKey() {
    return 'irb-94c2faa';
  }

  toSerializationAttrs() {
    return this.state.report ? this.state.report.serialize() : {};
  }

  fromSerializationAttrs(attrs) {
    return attrs.sections ? {report: Report.deserialize(attrs)} : {};
  }

  // State helpers

  hasStageClause() {
    return !!(this.state.stageClauses && this.state.stageClauses.length);
  }

  get activeStageClause() {
    return this.hasStageClause() ? this.state.stageClauses[this.state.stageClauses.length - 1] : null;
  }

  originStageClauseType() {
    return this.hasStageClause() && this.state.stageClauses[0].TYPE;
  }

  isAddingClause(sectionType) {
    return (
      this.originStageClauseType() === sectionType &&
      typeof this.state.stageClauseIndex !== 'number'
    );
  }

  isEditingClause(sectionType, clauseIndex) {
    return (
      this.originStageClauseType() === sectionType &&
      this.state.stageClauseIndex === clauseIndex
    );
  }

  // State modifiers

  resetTopQueries() {
    this.queries.topEventProperties.build(this.state).run().then(topEventProperties => {
      this.update({topEventProperties});
    });

    this.queries.topPeopleProperties.build(this.state).run().then(topPeopleProperties => {
      this.update({topPeopleProperties});
    });

    this.queries.topEvents.build(this.state).run().then(topEvents => {
      this.update({
        topEvents: topEvents
          .map(ev => ({name: ev, custom: false}))
          .concat(this.customEvents.map(ce => Object.assign(ce, {custom: true}))),
      });
      this.query();
    });
  }

  saveReport() {
    if (this.parentFrame) {
      return this.parentFrame.send('saveBookmark', this.state.report.toBookmarkData())
        .then(bookmark => {
          const report = Report.fromBookmarkData(bookmark);
          this.update({savedReports: extend(this.state.savedReports, {[report.id]: report})});
          this.navigate(`report/${report.id}`, {report});
        })
        .catch(err => {
          console.error(`Error saving: ${err}`);
        });
    } else {
      console.warn('Cannot save report without parent app');
    }
  }

  updateReport(attrs) {
    this.update({report: Object.assign(this.state.report, attrs)});
  }

  transformResult(result=this.state.result, options) {
    // commit 'analysis' and 'value' choices

    // the reason to cache results for different analysis choices isn't so much to save
    // computation, but rather to always save the result for 'linear' for the same
    // query. Otherwise, we'd either have to implement 'reverse' transformation (some
    // transformations might be irreversible too), or go down the 'query' path to come back to
    // 'linear', when the data was just there before. If we save for 'linear', we might as well
    // save for all types, which makes going from 'cumulative' to 'rolling' a one step thing
    // instead of via 'linear'.

    let analysis = (options && options.analysis) || this.state.report.displayOptions.analysis;

    if (analysis !== 'logarithmic') {
      if (!this.analysisCache.hasOwnProperty(analysis)) {
        // compute transformation
        let newSeries;
        switch (analysis) {
          case 'cumulative':
            newSeries = nestedObjectCumulative(result.series);
            break;
          case 'rolling':
            newSeries = nestedObjectRolling(result.series, ROLLING_WINDOWS_BY_UNIT[this.state.report.sections.time.clauses[0].unit]);
            break;
        }

        // set cache
        this.analysisCache[analysis] = newSeries;
      }
    } else {
      // for 'logarithmic', no transformation on the result is needed, we use 'linear' here and
      // leave it to 'line' and 'bar' to display correctly.

      analysis = 'linear';
    }

    result.series = this.analysisCache[analysis];
    return result;
  }

  loadReport(report) {
    const stateUpdate = extend(this.resettableState, report ? {report} : {});
    this.update(stateUpdate);
    this.resetTopQueries();
    return stateUpdate;
  }

  resetQuery() {
    return this.loadReport(null);
  }

  sortConfigFor(result, currentSortConfig=null) {
    let sortConfig = {
      bar: {
        sortBy: 'column',
        colSortAttrs: [
          {
            sortBy: 'value',
            sortOrder: 'desc',
          },
        ],
      },
      table: {
        sortBy: 'column',
        colSortAttrs: [
          {
            sortBy: 'label',
            sortOrder: 'asc',
          },
        ],
      },
    };

    if (result) {
      let numTableHeaders = result.headers.length;
      if (numTableHeaders > 1) {
        numTableHeaders--;
      }

      if (currentSortConfig) {

        // update existing sorting config for new results

        if (currentSortConfig.bar.sortBy === 'column') {
          let colSortAttrs = currentSortConfig.bar.colSortAttrs.slice(0, result.headers.length);
          for (let i = colSortAttrs.length; i < result.headers.length; i++) {
            colSortAttrs.push({sortBy: 'value', sortOrder: 'desc'});
          }
          sortConfig.bar.colSortAttrs = colSortAttrs;
        } else {
          sortConfig.bar = currentSortConfig.bar;
        }

        if (currentSortConfig.table.sortBy === 'column') {
          let colSortAttrs = currentSortConfig.table.colSortAttrs.slice(0, numTableHeaders);
          for (let i = colSortAttrs.length; i < numTableHeaders; i++) {
            colSortAttrs.push({sortBy: 'label', sortOrder: 'asc'});
          }
          sortConfig.table.colSortAttrs = colSortAttrs;
        } else {
          sortConfig.table = currentSortConfig.table;
        }
      } else {

        // no existing config; ensure that new config has right number of headers

        for (let i = sortConfig.bar.colSortAttrs.length; i < result.headers.length; i++) {
          sortConfig.bar.colSortAttrs.push({sortBy: 'value', sortOrder: 'desc'});
        }
        for (let i = sortConfig.table.colSortAttrs.length; i < numTableHeaders; i++) {
          sortConfig.table.colSortAttrs.push({sortBy: 'label', sortOrder: 'asc'});
        }

      }
    }

    return sortConfig;
  }

  stopEditingExtrasMenu() {
    this.update({isEditingExtrasMenu: false});
  }

  startAddingClause(sectionType) {
    this.update({stageClauses: this.state.stageClauses.concat(Clause.create(sectionType))});
  }

  startEditingClause(sectionType, clauseIndex) {
    const stageClauses = this.state.stageClauses.concat(
      this.state.report.sections[sectionType].clauses[clauseIndex]
    );

    if (stageClauses.length) {
      for (const clause of stageClauses) {
        clause.search = '';
      }
      this.update({
        stageClauses,
        stageClauseIndex: clauseIndex,
      });
    } else {
      throw new Error('app.startEditingClause error: invalid clauseIndex provided');
    }
  }

  stopEditingClause() {
    this.stopEditingClauseAttrs();

    const newState = {
      stageClauses: [],
      stageClauseIndex: null,
      resourceTypeFilter: 'all',
    };

    this.update(newState);
  }

  stopEditingClauseAttrs() {
    if (this.hasStageClause() && this.activeStageClause.valid) {
      this.updateStageClause({editing: null});
    }
  }

  updateStageClause(clauseData) {
    const stageClauses = this.state.stageClauses.concat();
    let currentClause = stageClauses.pop();
    if (currentClause) {
      stageClauses.push(currentClause.extend(clauseData));
    }
    let newState = {stageClauses};

    // query new property values if we're setting a new filter property
    if (this.activeStageClause.TYPE === 'filter' && clauseData.value) {
      let topPropertyValues = null;
      switch (clauseData.resourceType) {
        case 'people':
          topPropertyValues = this.queries.topPeoplePropertyValues;
          break;
        case 'events':
          topPropertyValues = this.queries.topEventPropertyValues;
          break;
      }
      const query = topPropertyValues.build(newState).query;
      const cachedResult = this.queries.topPropertyValuesCache.get(query);

      if (cachedResult) {
        newState.topPropertyValues = cachedResult;
      } else {
        topPropertyValues.run().then(topPropertyValues => {
          this.queries.topPropertyValuesCache.set(query, topPropertyValues);
          this.update({topPropertyValues});
        });
      }
    }

    this.update(newState);
  }

  commitStageClause() {
    const newClauses = this.state.stageClauses;
    const reportAttrs = extend(this.state.report);

    if (newClauses.length) {
      newClauses.filter(clause => clause.valid).forEach(clause => {
        const newClause = clause.extend({paneIndex: 0});
        let newSection = null;
        if (clause === newClauses[0] && typeof this.state.stageClauseIndex === 'number') {
          newSection = reportAttrs.sections[newClause.TYPE].replaceClause(this.state.stageClauseIndex, newClause);
        } else {
          newSection = reportAttrs.sections[newClause.TYPE].appendClause(newClause);
        }
        reportAttrs.sections = reportAttrs.sections.replaceSection(newSection);
      });

      this.updateReport(reportAttrs);
      this.query();
    }

    this.stopEditingClause();
  }

  updateSection(section) {
    const sections = this.state.report.sections.replaceSection(section);
    this.updateReport({sections});
    this.query();
  }

  moveClause(sectionType, clauseIndex, offset) {
    const section = this.state.report.sections[sectionType];
    const clause = section.clauses[clauseIndex];

    this.updateSection(
      section
        .removeClause(clauseIndex)
        .insertClause(clauseIndex + offset, clause)
    );
  }

  removeClause(sectionType, clauseIndex) {
    this.updateSection(this.state.report.sections[sectionType].removeClause(clauseIndex));
  }

  updateSeriesState(newState) {
    this.resetToastTimer();
    this.updateReport({series: extend(this.state.report.series, newState)});
  }

  startEditingSeries() {
    this.updateSeriesState({isEditing: true});
  }

  stopEditingSeries() {
    this.updateSeriesState({
      isEditing: false,
      search: null,
    });
  }

  updateSeriesData(result, defaultValue=true, showLimit=48) {
    const seriesSums = util.combineNestedObjKeys(util.nestedObjectSum(result.series));
    this.updateSeriesState({
      data: util.objectFromPairs(
        Object.keys(seriesSums)
          .sort((a, b) => seriesSums[b] - seriesSums[a])
          .map((v, idx) => [v, (idx < showLimit) ? defaultValue : false])
      ),
      currentSeries: result.headers[result.headers.length-1] || null,
    });
  }

  stopEditingChartToggle() {
    this.updateChartToggle({editingType: null});
  }

  updateChartToggle(options) {
    this.update({chartToggle: extend(this.state.chartToggle, options)});
  }

  updateDisplayOptions(displayOptions) {
    // for 'unique', 'average' and 'median', 'bar' and 'table' require a different query than
    // 'line'.
    const chartType = displayOptions.chartType;
    if (this.state.report.sections.show.clauses.some(clause => ['unique', 'average', 'median'].includes(clause.math)) &&
        (chartType === 'line' && ['bar', 'table'].includes(this.state.report.displayOptions.chartType)
         || ['bar', 'table'].includes(chartType) && this.state.report.displayOptions.chartType === 'line')) {
      this.query(displayOptions).then(() => this.updateReport({displayOptions})); // update displayOptions after results are committed.
    } else {
      this.updateReport({displayOptions});
      this.update({result: this.transformResult()});
    }
  }

  differentResult(result) {
    return !util.isEqual(pick(this.state.result, ['series', 'headers']), result);
  }

  resetToastTimer() {
    if (!this.state.newCachedData) {
      clearTimeout(this.toastTimer);
      this.toastTimer = setTimeout(() => this._checkForNewResults(), 15 * MINUTE_MS);
    }
  }

  _checkForNewResults() {
    this.queries.segmentation.run()
      .then(result=> {
        if (this.differentResult(result)) {
          this.update({newCachedData: true});
          this.queries.segmentationCache.set(
            this.queries.segmentation.build(this.state).query,
            result,
            60
          );
        } else {
          this.resetToastTimer();
        }
      });
    this.update({toastTimer: null});
  }

  query(options={}) {
    options = Object.assign({useCache: true}, options);
    const query = this.queries.segmentation.build(this.state, options).query;
    const cachedResult = options.useCache && this.queries.segmentationCache.get(query);
    const cacheExpiry = 10; // seconds

    if (!cachedResult) {
      this.update(extend(this.state, {resultLoading: true}));
    }

    this.update({newCachedData: false});
    this.resetToastTimer();
    return this.queries.segmentation.run(cachedResult)
      .then(result => {
        if (!cachedResult) {
          this.queries.segmentationCache.set(query, result, cacheExpiry);
          if (this.differentResult(result)) {
            // reset cache for different 'analysis' results by only saving for linear.
            this.analysisCache = {linear: result.series};
          }
        }
        this.updateSeriesData(result);
        this.update({result: this.transformResult(result, options), newCachedData: false, resultLoading: false});
        this.updateReport({sorting: this.sortConfigFor(result, this.state.report.sorting)});
      })
      .catch(err => console.error(err));
  }
});
