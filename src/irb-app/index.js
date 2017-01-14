import throttle from 'lodash/throttle';
import MPApp from 'mixpanel-common/report/mp-app';
import { extend } from 'mixpanel-common/util';
import * as util from '../util';

import { mixpanel, rollbar } from '../tracking';

import BuilderSections from '../models/builder-sections';
import { ShowSection, TimeSection } from '../models/section';
import { Clause, ShowClause, TimeClause } from '../models/clause';
import Legend from '../models/legend';
import TopEventsQuery from '../models/queries/top-events';
import { TopEventPropertiesQuery, TopPeoplePropertiesQuery } from '../models/queries/top-properties';
import { TopEventPropertyValuesQuery, TopPeoplePropertyValuesQuery } from '../models/queries/top-property-values';
import SegmentationQuery from '../models/queries/segmentation';
import QueryCache from '../models/queries/query-cache';
import Report from '../models/report';
import Result from '../models/result';

import './irb-header';
import './irb-result';
import './new-irb-builder';
import './old-irb-builder';

import LearnFlow from './irb-learn/flow';
import './irb-learn';

import template from './index.jade';
import './index.styl';

const MINUTE_MS = 1000 * 60;

document.registerElement(`irb-app`, class IRBApp extends MPApp {
  get config() {
    return {
      defaultState: extend(
        this.resettableState,
        {
          // The following states should persist through reset.
          features: {},
          savedReports: [],
          recentEvents: [],
          recentProperties: [],
          util,
        }
      ),

      routes: {
        'nofeatures':       this.routeHandlers.noFeatures,
        'report/:reportId': this.routeHandlers.load,
        'reset':            this.routeHandlers.reset,
        'learn':            this.routeHandlers.learn,
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
          return this.navigate(``);
        } else {
          if (!stateUpdate.report) {
            stateUpdate = extend(stateUpdate, this.loadReport(report));
          }
          return stateUpdate;
        }
      },

      noFeatures: (stateUpdate={}) => {
        const features = extend(this.state.features, {
          queryBuilderVersion: `old`,
          queryOnAllPeople: false,
        });
        return extend(stateUpdate, {features});
      },

      index: (stateUpdate={}) => {
        if (this.state.report.id) {
          stateUpdate = extend(stateUpdate, this.resetQuery());
        } else if (!stateUpdate.report) {
          this.resetTopQueries();
        }
        return stateUpdate;
      },

      reset: (stateUpdate={}) => {
        return this.navigate(``, extend(stateUpdate, this.resetQuery()));
      },

      learn: (stateUpdate={}) => {
        return extend(stateUpdate, this.resetQuery(), {
          learnFlow: new LearnFlow({app: this}),
        });
      },
    });
  }

  // The following states should be reset.
  get resettableState() {
    return {
      report: new Report({
        displayOptions: {
          chartType: `bar`,
          plotStyle: `standard`,
          analysis: `linear`,
          value: `absolute`,
        },
        sections: new BuilderSections({
          show: new ShowSection(new ShowClause({value: ShowClause.TOP_EVENTS})),
          time: new TimeSection(new TimeClause({range: TimeClause.RANGES.HOURS})),
        }),
        legend: new Legend({
          data: [],
          search: null,
        }),
        sorting: this.sortConfigFor(null),
        title: `Untitled report`,
      }),

      builderPane: this.defaultBuilderState,
      chartToggle: {
        editingType: null,
        bar: {
          plotStyle: `standard`,
        },
        line: {
          plotStyle: `standard`,
        },
        table: {
          plotStyle: `standard`,
        },
      },
      activeMathMenuIndex: null,
      contextFilter: ``,
      isEditingExtrasMenu: false,
      isEditingNumericProperty: false,
      isEditingTypecast: false,
      newCachedData: false,
      resourceTypeFilter: `all`,
      result: new Result({
        headers: [],
        series: {},
      }),
      resultLoading: true,
      stageClauses: [],
      topEvents: [],
      topEventProperties: [],
      topEventPropertiesByEvent: {},
      topPeopleProperties: [],
      topPropertyValues: [],
    };
  }

  attachedCallback() {
    this.customEvents = (this.parentData && this.parentData.custom_events) || [];

    let projectHasEvents = true;
    let queryBuilderVersion = `old`;
    let queryOnAllPeople = false;
    if (this.standalone) {
      queryBuilderVersion = `new`;
      queryOnAllPeople = true;
    }

    if (this.parentData) {
      // don't start persisting yet
      if (this.parentData.whitelists) {
        queryBuilderVersion = this.parentData.whitelists.includes(`irb-new-query-builder`) ? `new` : queryBuilderVersion;
        queryOnAllPeople = this.parentData.whitelists.includes(`dev`) ? true : queryOnAllPeople;
      }
      projectHasEvents = !!this.parentData.has_integrated_arb;
      Object.assign(this.state, {
        savedReports: this.parentData.bookmarks.reduce(
          (reports, bm) => extend(reports, {[bm.id]: Report.fromBookmarkData(bm)}),
          {}
        ),
      });
    }

    this.state.projectHasEvents = projectHasEvents;
    this.state.features = {
      queryBuilderVersion,
      queryOnAllPeople,
    };

    this.state.recentEvents = this._getRecentList(`events`);
    this.state.recentProperties = this._getRecentList(`properties`);

    if (this.parentFrame) {
      this.parentFrame.addHandler(`deleteBookmark`, this.deleteReport.bind(this));
    }

    this.queries = {};
    if (this.canMakeQueries()) {
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
    }


    super.attachedCallback(...arguments);

    if (this.state.report.id) {
      this.navigate(`report/${this.state.report.id}`);
    }

    window.requestAnimationFrame(() => {
      const stickyClassName = `sticky-chart-headers`;
      window.addEventListener(`scroll`, throttle(() => {
        const chart = this.querySelector(`.chart`);
        const isBarChart = this.state.report.displayOptions.chartType === `bar`;
        if (isBarChart && chart && chart.getBoundingClientRect().top <= 0) {
          this.parentNode.classList.add(stickyClassName);
          const legend = this.querySelector(`.legend`);
          if (legend) {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
            const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
            const distFromBottom = scrollHeight - (scrollTop + window.innerHeight);
            const appBottomMargin = 20; // padding on .irb-main-panel
            const spacingForBottom = Math.max(appBottomMargin - distFromBottom, 0);
            if (spacingForBottom) {
              legend.style.height = `calc(100vh - ${spacingForBottom}px)`;
            } else {
              legend.style.height = ``;
            }
          }
        } else {
          this.parentNode.classList.remove(stickyClassName);
        }
      }, 10));
    });
  }

  navigateToSetup() {
    this.trackEvent(`No Data - Click Install Mixpanel`)
      .then(() => this.parentFrame && this.parentFrame.send(`navigateToSetup`));
  }

  // Serialization helpers

  get persistenceKey() {
    return `irb-de8ae95`;
  }

  toSerializationAttrs() {
    return this.state.report ? this.state.report.serialize() : {};
  }

  fromSerializationAttrs(attrs) {
    return attrs.sections ? {report: Report.deserialize(attrs)} : {};
  }

  updateRecentEvents(mpEvent) {
    this._updateRecentList(`events`, mpEvent);
  }

  updateRecentProperties(property) {
    this._updateRecentList(`properties`, property);
  }

  _getRecentPersistenceKey(type) {
    return `recent-${type}`;
  }

  _getRecentList(type) {
    return JSON.parse(this.persistence.get(this._getRecentPersistenceKey(type))) || [];
  }

  _updateRecentList(type, value) {
    // remove any match data from view object
    value = extend(value);
    delete value.matches;

    const stateKey = type === `events` ? `recentEvents` : `recentProperties`;
    this.update({[stateKey]: [
      value, ...this.state[stateKey].filter(oldValue => !util.isEqual(value, oldValue)),
    ].slice(0, 10)});
    this.persistence.set(this._getRecentPersistenceKey(type), JSON.stringify(this.state[stateKey]));
  }

  // Report management

  openReportList() {
    if (this.parentFrame) {
      this.parentFrame.send(`chooseBookmark`)
        .then(bookmarkId => {
          if (bookmarkId) {
            this.navigate(`report/${bookmarkId}`);
            this.trackEvent(`Report list - select report`, {'report id': bookmarkId});
          }
        });
      this.trackEvent(`Report list - open`);
    }
  }

  deleteReport(reportId) {
    const report = this.state.savedReports[reportId];
    const trackingData = report ? report.toTrackingData() : {};

    delete this.state.savedReports[reportId];
    if (this.state.report.id === reportId) {
      this.navigate(``);
    } else {
      this.update();
    }

    this.trackEvent(`Delete Report`, trackingData);
  }

  loadReport(report) {
    const stateUpdate = extend(this.resettableState, report ? {report} : {});
    this.update(stateUpdate);
    this.resetTopQueries();
    this.trackEvent(`Load Report`, report ? report.toTrackingData() : {});
    return stateUpdate;
  }

  saveReport() {
    if (this.parentFrame) {
      const reportTrackingData = this.state.report.toTrackingData();
      return this.parentFrame.send(`saveBookmark`, this.state.report.toBookmarkData())
        .then(bookmark => {
          const report = Report.fromBookmarkData(bookmark);
          this.update({savedReports: extend(this.state.savedReports, {[report.id]: report})});
          this.navigate(`report/${report.id}`, {report});
          this.trackEvent(`Save Report`, extend(reportTrackingData, {
            'new report': !this.state.savedReports.hasOwnProperty(report.id),
            'report title': report.title,
          }));
        })
        .catch(err => {
          console.error(`Error saving: ${err}`);
        });
    } else {
      console.warn(`Cannot save report without parent app`);
    }
  }

  // New query builder helpers

  get defaultBuilderState() {
    return {
      inTransition: false,
      isContextualMenuOpen: false,
      isEditingTypecast: false,
      offsetStyle: {},
      screens: [],
      sizeStyle: {
        width: `0px`,
        height: `0px`,
      },
    };
  }

  startBuilderOnScreen(componentName) {
    const hasExistingScreens = !!this.state.builderPane.screens.length;
    const screens = [{componentName}];
    this.stopBuildingQuery();
    if (hasExistingScreens) {
      this.updateBuilder({inTransition: true}, {screens});
    } else {
      this.updateBuilder({screens});
    }
  }

  stopBuildingQuery() {
    if (this.state.features.queryBuilderVersion === `new`) {
      this.resetBuilder();
      this.stopEditingClause();
    }
  }

  resetBuilder() {
    this.updateBuilder(this.defaultBuilderState);
  }

  updateBuilder(attrs, postTransitionAttrs={}) {
    this.update({builderPane: extend(this.state.builderPane, attrs)});
    if (attrs.inTransition) {
      setTimeout(() => {
        this.updateBuilder(extend(postTransitionAttrs, {inTransition: false}));
      }, 250);
    }
  }

  updateBuilderCurrentScreen(attrs) {
    const screens = this.state.builderPane.screens;
    const screen = this.getBuilderCurrentScreen();

    this.update({
      builderPane: extend(this.state.builderPane, {
        screens: [...screens.slice(0, -1), extend(screen, attrs)],
      }),
    });
  }

  getBuilderCurrentScreen() {
    const screens = this.state.builderPane.screens;
    return screens[screens.length - 1];
  }

  // State helpers

  hasStageClause(state=this.state) {
    return !!(state.stageClauses && state.stageClauses.length);
  }

  getActiveStageClause(state=this.state) {
    return this.hasStageClause() ? state.stageClauses[this.state.stageClauses.length - 1] : null;
  }

  get activeStageClause() {
    return this.getActiveStageClause();
  }

  originStageClauseType() {
    return this.hasStageClause() && this.state.stageClauses[0].TYPE;
  }

  originStageClauseIsPeopleProperty() {
    return this.hasStageClause()
      && this.state.stageClauses[0].value
      && this.state.stageClauses[0].value.resourceType === `people`;
  }

  isAddingClause(sectionType) {
    return (
      this.originStageClauseType() === sectionType &&
      typeof this.state.stageClauseIndex !== `number`
    );
  }

  isEditingClause(sectionType, clauseIndex) {
    return (
      this.originStageClauseType() === sectionType &&
      this.state.stageClauseIndex === clauseIndex
    );
  }

  trackEvent(eventName, properties) {
    try {
      return new Promise(resolve => {
        mixpanel.track(eventName, properties, resolve);
        setTimeout(resolve, 500);
      });
    } catch (e) {
      rollbar.error(`tracking error`, e);
    }
  }

  canMakeQueries() {
    return this.state.projectHasEvents;
  }

  getClausesForType(type) {
    return this.state.report.sections[type].clauses;
  }

  getClauseValuesForType(type) {
    return this.app.getClausesForType(type).map(clause => clause.value);
  }

  // State modifiers

  resetTopQueries() {
    if (this.canMakeQueries()) {
      this.update({topEventProperties: TopEventPropertiesQuery.LOADING});
      this.queries.topEventProperties.build(this.state).run().then(topEventProperties => {
        this.update({topEventProperties});
      });

      this.update({topPeopleProperties: TopPeoplePropertiesQuery.LOADING});
      this.queries.topPeopleProperties.build(this.state).run().then(topPeopleProperties => {
        this.update({topPeopleProperties});
      });

      this.update({topEvents: TopEventsQuery.LOADING});
      const topEventsQuery = this.queries.topEvents.build(this.state).run().then(topEvents => {
        this.update({
          topEvents: topEvents
            .map(ev => ({name: ev, custom: false}))
            .concat(this.customEvents.map(ce => Object.assign(ce, {custom: true}))),
        });
      });

      // check whether we need to wait for Top Events query before launching the main query
      const needsTopEvents = this.state.report.sections.show.clauses.some(showClause =>
        showClause.value.name === ShowClause.TOP_EVENTS.name
      );
      (needsTopEvents ? topEventsQuery : Promise.resolve()).then(() => this.query());
    }
  }

  fetchTopPropertiesForEvent(mpEvent) {
    if (!this.state.topEventPropertiesByEvent[mpEvent]) {
      this.updateTopPropertiesForEvent(mpEvent, TopEventPropertiesQuery.LOADING);
      this.queries.topEventProperties.build({event: mpEvent}).run()
        .then(properties => this.updateTopPropertiesForEvent(mpEvent, properties));
    }
  }

  updateTopPropertiesForEvent(mpEvent, properties) {
    this.update({
      topEventPropertiesByEvent: extend(
        this.state.topEventPropertiesByEvent,
        {[mpEvent]: properties}
      ),
    });
  }

  updateReport(attrs) {
    this.update({report: Object.assign(this.state.report, attrs)});
  }

  resetQuery() {
    return this.loadReport(null);
  }

  sortConfigFor(result, currentSortConfig=null) {
    let sortConfig = {
      bar: {
        sortBy: `column`,
        colSortAttrs: [
          {
            sortBy: `value`,
            sortOrder: `desc`,
          },
        ],
      },
      table: {
        sortBy: `column`,
        colSortAttrs: [
          {
            sortBy: `label`,
            sortOrder: `asc`,
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

        if (currentSortConfig.bar.sortBy === `column`) {
          let colSortAttrs = currentSortConfig.bar.colSortAttrs.slice(0, result.headers.length);
          for (let i = colSortAttrs.length; i < result.headers.length; i++) {
            colSortAttrs.push({sortBy: `value`, sortOrder: `desc`});
          }
          sortConfig.bar.colSortAttrs = colSortAttrs;
        } else {
          sortConfig.bar = currentSortConfig.bar;
        }

        if (currentSortConfig.table.sortBy === `column`) {
          let colSortAttrs = currentSortConfig.table.colSortAttrs.slice(0, numTableHeaders);
          for (let i = colSortAttrs.length; i < numTableHeaders; i++) {
            colSortAttrs.push({sortBy: `label`, sortOrder: `asc`});
          }
          sortConfig.table.colSortAttrs = colSortAttrs;
        } else {
          sortConfig.table = currentSortConfig.table;
        }
      } else {

        // no existing config; ensure that new config has right number of headers

        for (let i = sortConfig.bar.colSortAttrs.length; i < result.headers.length; i++) {
          sortConfig.bar.colSortAttrs.push({sortBy: `value`, sortOrder: `desc`});
        }
        for (let i = sortConfig.table.colSortAttrs.length; i < numTableHeaders; i++) {
          sortConfig.table.colSortAttrs.push({sortBy: `label`, sortOrder: `asc`});
        }

      }
    }

    return sortConfig;
  }

  stopEditingExtrasMenu() {
    this.update({isEditingExtrasMenu: false});
  }

  startAddingClause(sectionType, attrs={}) {
    this.update({stageClauses: this.state.stageClauses.concat(Clause.create(sectionType, attrs))});
  }

  startEditingClause(sectionType, clauseIndex) {
    const stageClauses = this.state.stageClauses.concat(
      this.state.report.sections[sectionType].clauses[clauseIndex]
    );

    if (stageClauses.length) {
      for (const clause of stageClauses) {
        clause.search = ``;
      }
      this.update({
        stageClauses,
        stageClauseIndex: clauseIndex,
      });
      this.updateStageClause(this.activeStageClause); // check for new data to fetch
    } else {
      throw new Error(`app.startEditingClause error: invalid clauseIndex provided`);
    }
  }

  stopEditingClause() {
    this.stopEditingClauseAttrs();
    const newState = {
      activeMathMenuIndex: null,
      contextFilter: ``,
      stageClauses: [],
      stageClauseIndex: null,
      resourceTypeFilter: `all`,
    };

    this.update(newState);
  }

  stopEditingClauseAttrs() {
    if (this.hasStageClause() && this.activeStageClause.valid) {
      this.updateStageClause({editing: null});
    }
  }

  updateStageClause(clauseData={}) {
    const stageClauses = this.state.stageClauses.concat();
    let currentClause = stageClauses.pop();
    if (currentClause) {
      stageClauses.push(currentClause.extend(clauseData));
    }
    let newState = {stageClauses};

    // query new property values if we're setting a new filter property
    if (this.activeStageClause.TYPE === `filter` && clauseData.value) {
      let topPropertyValues = null;
      switch (clauseData.resourceType) {
        case `people`:
          topPropertyValues = this.queries.topPeoplePropertyValues;
          break;
        case `events`:
          topPropertyValues = this.queries.topEventPropertyValues;
          break;
      }
      this.update({topPropertyValues: TopEventsQuery.LOADING});
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

  commitStageClause({shouldStopEditing=true}={}) {
    const reportTrackingData = this.state.report.toTrackingData();
    const newClauses = this.state.stageClauses;
    const reportAttrs = extend(this.state.report);

    if (newClauses.length) {
      newClauses.filter(clause => clause.valid).forEach(clause => {
        const newClause = clause.extend({paneIndex: 0});
        let newSection = null;
        const isEditingClause = clause === newClauses[0] && typeof this.state.stageClauseIndex === `number`;
        if (newClause.TYPE === ShowClause.TYPE && newClause.resourceType === Clause.RESOURCE_TYPE_PEOPLE) {
          if (reportAttrs.displayOptions.chartType === `line`) {
            reportAttrs.displayOptions.chartType = `bar`;
          }
        }
        if (isEditingClause) {
          newSection = reportAttrs.sections[newClause.TYPE].replaceClause(this.state.stageClauseIndex, newClause);
        } else {
          if (clause === newClauses[1] && newClause.TYPE === ShowClause.TYPE && newClauses[0].TYPE === ShowClause.TYPE) {
            // operator on property + event
            let showClauseIdx = this.state.stageClauseIndex;
            if (typeof showClauseIdx !== `number`) {
              // newly-appended clause
              showClauseIdx = reportAttrs.sections.show.clauses.length - 1;
            }
            const joinedClause = reportAttrs.sections.show.clauses[showClauseIdx].extend({});
            joinedClause.property = joinedClause.value;
            joinedClause.value = newClause.value;
            newSection = reportAttrs.sections.show.replaceClause(showClauseIdx, joinedClause);
          } else {
            newSection = reportAttrs.sections[newClause.TYPE].appendClause(newClause);
          }
        }
        reportAttrs.sections = reportAttrs.sections.replaceSection(newSection);
        let clauseProperties = clause.serialize();
        if (typeof clauseProperties.value === `object`) {
          clauseProperties = extend(clauseProperties, clauseProperties.value);
          delete clauseProperties.value;
        }
        this.trackEvent(
          `Builder - ${isEditingClause ? `Edit` : `Add`} ${clause.formattedType()} Clause`,
          extend(reportTrackingData, clauseProperties)
        );
      });

      this.updateReport(reportAttrs);
      this.query();
    }

    if (shouldStopEditing) {
      this.stopEditingClause();
      this.stopBuildingQuery();
    }
  }

  updateSection(section) {
    const sections = this.state.report.sections.replaceSection(section);
    this.updateReport({sections});
    this.query();
  }

  updateClause(sectionType, clauseIndex, clauseData) {
    const section = this.state.report.sections[sectionType];
    const clause = section.clauses[clauseIndex];

    this.updateSection(
      section.replaceClause(clauseIndex, clause.extend(clauseData))
    );
  }

  moveClause(sectionType, clauseIndex, offset) {
    const reportTrackingData = this.state.report.toTrackingData();
    const section = this.state.report.sections[sectionType];
    const clause = section.clauses[clauseIndex];

    this.updateSection(
      section
        .removeClause(clauseIndex)
        .insertClause(clauseIndex + offset, clause)
    );
    this.trackEvent(`Builder - Reorder Group Clause`, extend(reportTrackingData, {
      'current position': clauseIndex,
      'new position': clauseIndex + offset,
      'reorder direction': offset === 1 ? `right` : `left`,
    }));
  }

  removeClause(sectionType, clauseIndex) {
    const reportTrackingData = this.state.report.toTrackingData();
    this.updateSection(this.state.report.sections[sectionType].removeClause(clauseIndex));
    this.trackEvent(`Builder - Remove Clause`, extend(reportTrackingData, {
      'clause type': sectionType,
      'clause index': clauseIndex,
    }));
  }

  updateLegendState(newState) {
    this.resetToastTimer();
    this.updateReport({legend: this.state.report.legend.update(newState)});
  }

  updateLegendSeriesAtIndex(seriesIdx, dataType, attrs) {
    this.resetToastTimer();
    let legendUpdate = {[seriesIdx]: attrs};
    if (dataType === this.state.report.legend.SERIES_DATA) {
      const keysToMatch = Object.keys(attrs).filter(key => Boolean(attrs[key]));
      if (keysToMatch.length === 1) {
        const depthOffsetForData = 2;
        const ancestors = util.reachableNodesOfKey({
          series: this.state.result.series,
          depth: seriesIdx + depthOffsetForData,
          keysToMatch,
        });
        legendUpdate = Object.keys(ancestors).reduce((obj, key) => {
          obj[Number(key) - depthOffsetForData] = ancestors[key];
          return obj;
        }, {});
      }
    }

    this.updateReport({
      legend: this.state.report.legend.updateSeriesAtIndex({
        dataType,
        legendUpdate,
      }),
    });
  }

  stopEditingChartToggle() {
    this.updateChartToggle({editingType: null});
  }

  updateChartToggle(options) {
    this.update({chartToggle: extend(this.state.chartToggle, options)});
  }

  updateDisplayOptions(displayOptions) {
    // for 'min', 'max', 'unique', 'average' and 'median', 'bar' and 'table' require a different query than
    // 'line'.
    const chartType = displayOptions.chartType;
    Promise.resolve()
      .then(() => {
        const isNotTotal = this.state.report.sections.show.clauses.some(clause => [`min`, `max`, `unique`, `average`, `median`].includes(clause.math));
        const isChangingToLineChart = chartType === `line` && [`bar`, `table`].includes(this.state.report.displayOptions.chartType);
        const isChangingFromLineChart = [`bar`, `table`].includes(chartType) && this.state.report.displayOptions.chartType === `line`;
        return isNotTotal && (isChangingToLineChart || isChangingFromLineChart) && this.query(displayOptions);
      })
      .then(() => {
        const shouldResetSorting = chartType === `bar` && displayOptions.plotStyle === `stacked` && this.state.report.sorting.bar.sortBy === `value`;
        const sorting = shouldResetSorting ? this.sortConfigFor(this.state.result) : this.state.report.sorting;
        this.updateReport({displayOptions, sorting});
      });
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
        if (!this.state.result.isEqual(result)) {
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
    if (this.canMakeQueries()) {
      const reportTrackingData = this.state.report.toTrackingData();
      options = Object.assign({useCache: true}, options);
      const query = this.queries.segmentation.build(this.state, options).query;
      const cachedResult = options.useCache && this.queries.segmentationCache.get(query);
      const cacheExpiry = 10; // seconds

      if (!cachedResult) {
        this.update({resultLoading: true});
      }

      this.update({newCachedData: false});
      this.resetToastTimer();
      const queryStartTime = window.performance.now();
      const queryEventProperties = {'cached': !!cachedResult};

      this.trackEvent(`Query Start`, extend(reportTrackingData, queryEventProperties));

      return this.queries.segmentation.run(cachedResult)
        .then(result => {
          if (!cachedResult) {
            this.queries.segmentationCache.set(query, result, cacheExpiry);
            queryEventProperties[`latency ms`] = Math.round(window.performance.now() - queryStartTime);
          }

          this.update({result, newCachedData: false, resultLoading: false});
          // TODO: Handle searching better by only updating legend data on different queries
          this.updateReport({
            sorting: this.sortConfigFor(result, this.state.report.sorting),
            legend: this.state.report.legend.updateLegendData(result),
          });
        })
        .catch(err => {
          console.error(err);
          queryEventProperties[`error`] = err;
        })
        .then(() => {
          this.trackEvent(`Query Finish`, extend(reportTrackingData, queryEventProperties));
        });
    }
  }
});
