import MPApp from 'mixpanel-common/build/report/mp-app';
import { extend, pick } from 'mixpanel-common/build/util';
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
        chartOptions: {
          chartTypeEditing: null,
          selectedStyleToggles: {},
          style: 'standard',
          type: 'bar',
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
        title: 'Untitled report',
      }),

      newCachedData: false,
      resourceTypeFilter: 'all',
      result: {
        headers: [],
        series: {},
        loading: true,
      },
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

    super.attachedCallback(...arguments);

    if (this.state.report.id) {
      this.navigate(`report/${this.state.report.id}`);
    }
  }

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

  // Serialization helpers

  get persistenceKey() {
    return 'irb-81f19e4';
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

  loadReport(report) {
    const stateUpdate = extend(this.resettableState, report ? {report} : {});
    this.update(stateUpdate);
    this.resetTopQueries();
    return stateUpdate;
  }

  resetQuery() {
    return this.loadReport(null);
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

  updateSeriesData(result, defaultValue=true) {
    this.updateSeriesState({
      data: util.objectFromPairs(util.nestedObjectKeys(result.series, 2).map(v => [v, defaultValue])),
      currentSeries: result.headers[result.headers.length-1] || null,
    });
  }

  stopEditingChartStyle() {
    this.updateChartOptions({chartTypeEditing: null});
  }

  updateChartOptions(options) {
    this.updateReport({chartOptions: extend(this.state.report.chartOptions, options)});
  }

  updateChartType(type, style='standard') {
    // For some types of query, changing to a different chart type necessitates a new
    // query. Check the correct conditions here and call 'query'.

    // for 'unique', 'average' and 'median', 'bar' and 'table' require a different query than
    // 'line'.
    this.stopEditingChartStyle();
    if (this.state.report.sections.show.clauses.some(clause => ['unique', 'average', 'median'].includes(clause.math)) &&
        (type === 'line' && ['bar', 'table'].includes(this.state.report.chartOptions.type)
         || ['bar', 'table'].includes(type) && this.state.report.chartOptions.type === 'line')) {
      this.query({chartOptions: {type, style}});
    } else {
      this.updateChartOptions({type, style});
    }
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
        if (!util.isEqual(pick(this.state.result, ['series', 'headers']), result)) {
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
    options = Object.assign({useCache: true, chartOptions: {}}, options);
    const query = this.queries.segmentation.build(this.state, options).query;
    const cachedResult = options.useCache && this.queries.segmentationCache.get(query);
    const cacheExpiry = 10; // seconds

    if (!cachedResult) {
      let result = extend(this.state.result, {loading: true});
      this.update({result});
    }

    this.update({newCachedData: false});
    this.resetToastTimer();
    this.queries.segmentation.run(cachedResult)
      .then(result => {
        if (!cachedResult) {
          this.queries.segmentationCache.set(query, result, cacheExpiry);
        }
        this.updateSeriesData(result);
        this.update({result, newCachedData: false});
        this.updateChartOptions({type: options.chartOptions.type || this.state.report.chartOptions.type});
      })
      .catch(err => console.error(err));
  }
});
