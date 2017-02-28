import JSURL from 'jsurl';
import isEqual from 'lodash/isEqual';
import kebabCase from 'lodash/kebabCase';
import MPApp from 'mixpanel-common/report/mp-app';
import Persistence from 'mixpanel-common/report/persistence';
import { extend } from 'mixpanel-common/util';
import * as util from '../util';

import { mixpanel, rollbar } from '../tracking';

import BuilderSections from '../models/builder-sections';
import { FilterSection, GroupSection, ShowSection, TimeSection } from '../models/section';
import { Clause, ShowClause, TimeClause } from '../models/clause';
import Legend from '../models/legend';
import TopEventsQuery from '../models/queries/top-events';
import { TopEventPropertiesQuery, TopPeoplePropertiesQuery } from '../models/queries/top-properties';
import { TopEventPropertyValuesQuery, TopPeoplePropertyValuesQuery } from '../models/queries/top-property-values';
import SegmentationQuery from '../models/queries/segmentation';
import QueryCache from '../models/queries/query-cache';
import Report from '../models/report';
import Result from '../models/result';

import './insights-header';
import './insights-builder';
import './insights-result';
import './insights-learn';
import './insights-reports';

import template from './index.jade';
import './index.styl';

const MINUTE_MS = 1000 * 60;

document.registerElement(`insights-app`, class InsightsApp extends MPApp {
  get config() {
    return {
      template,
      defaultState: extend(
        this.resettableState,
        {
          // The following states should persist through reset.
          features: {},
          savedReports: {},
          recentEvents: [],
          recentProperties: [],
          util,
        }
      ),
      routes: {
        'report/:reportId':             this.routeHandlers.load,
        'report/:reportId/:reportName': this.routeHandlers.load,
        'reset':                        this.routeHandlers.reset,
        'learn':                        this.routeHandlers.learn,
        ':jsurl':                       this.routeHandlers.jsurl,
        '':                             this.routeHandlers.index,
      },
      helpers: {
        finishLearn: () => this.finishLearn(),
        toastClosed: () => this.update({newCachedData: false}),
        toastSelected: () => {
          const reportTrackingData = this.state.report.toTrackingData();
          this.query();
          this.trackEvent(
            `Refresh Report`,
            extend(reportTrackingData, {toast: true})
          );
        },
      },
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
            stateUpdate = extend(stateUpdate, this.loadReport(report, {trackLoading: true}));
          }
          return stateUpdate;
        }
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
        this.trackEvent(`[Onboarding] View Intro`);
        return extend(stateUpdate, this.resetQuery(), {learnActive: true});
      },

      jsurl: (stateUpdate={}, jsurl) => {
        let parsedURL = jsurl && JSURL.tryParse(jsurl);
        if (jsurl && !parsedURL) {
          // if there is a JSURL but it is invalid make sure it is surrounded by ~( ... ). This can be stripped by some sites
          jsurl = `~(${jsurl.replace(/^\~\(|\)$/g, ``)})`;
          parsedURL = JSURL.tryParse(jsurl);
          if (parsedURL) {
            history.replaceState(null, null, `#${jsurl}`);
          }
        }
        if (parsedURL) {
          const report = Report.deserialize(extend(this.defaultReportState, parsedURL));
          if (report && report.valid) {
            return extend(stateUpdate, this.loadReport(report));
          }
        }
        this.navigate(``, extend(stateUpdate, this.resetQuery()));
      },
    });
  }

  viewedIntro() {
    this.mpContext.setFlag(`VIEWED_INSIGHTS_INTRO`);
  }

  transitionLearn() {
    this.viewedIntro();
    util.transitionLearn(this.state.report, this.state.learnModalStepIndex, {
      start: () => this.update({learnTransitioningOut: true}),
      middle: () => this.update({learnTransitioningOut: false, learnTransitioningIn: true}),
      end: () => this.update({learnTransitioningIn: false}),
      startReminder: () => {
        if (!this.hasStageClause() && !this.state.builderPane.isContextualMenuOpen) {
          this.update({learnReminding: true});
        }
      },
      endReminder: () => this.update({learnReminding: false}),
    });

    const step = util.getLearnStep(this.state.report, this.state.learnModalStepIndex);
    const tooltip = step.trackName === `Close` ? `` : ` Tooltip`;
    this.trackEvent(`[Onboarding] View ${step.trackName}${tooltip}`);
  }

  finishLearn({track=true}={}) {
    this.viewedIntro();
    if (track) {
      const step = util.getLearnStep(this.state.report, this.state.learnModalStepIndex);
      this.trackEvent(`[Onboarding] Exit`, {'Location': step.trackName});
    }
    this.update({learnActive: false, learnModalStepIndex: null});
    this.navigate(``);
  }

  // The following states should be reset.
  get resettableState() {
    return {
      report: this.defaultReportState,
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
      showClauseButtonPosition: {},
      contextFilter: ``,
      isEditingExtrasMenu: false,
      isEditingNumericProperty: false,
      isEditingTypecast: false,
      newCachedData: false,
      reportsDrawerOpen: false,
      resourceTypeFilter: `all`,
      result: new Result({
        headers: [],
        series: {},
      }),
      resultLoading: true,
      stageClauses: [],
      stickyHeader: {},
      topEvents: [],
      topEventProperties: [],
      topEventPropertiesByEvent: {},
      topPeopleProperties: [],
      topPropertyValues: [],
      upsellModal: null,
    };
  }

  get defaultReportState() {
    return new Report({
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
      title: ``,
    });
  }

  /* feature gate fcns */

  getFeatureGateValue(feature) {
    const gates = this.mpContext.featureGates;
    if (gates && gates[feature] !== undefined) {
      return gates[feature];
    }
    return feature === `can_export_csv` ? true :  9223372036854776000; //python max int, aka featureGates.unlimited
  }

  canAddFilterClause() {
    const filterClauseLength = this.state.report.sections.filter.clauses.length;
    return filterClauseLength < this.getFeatureGateValue(`max_insights_filters`);
  }

  canAddBuilderClause() {
    const sections = this.state.report.sections;
    const allClauseLength = sections.group.clauses.length + sections.show.clauses.length - 1;
    return allClauseLength < this.getFeatureGateValue(`max_segmentation_filters`);
  }

  maxDataHistoryDays() {
    return this.getFeatureGateValue(`max_data_history_days`);
  }

  openUpsellModal(type) {
    let clickHandlers = this.app.clickOutsideHandlers;
    if (clickHandlers.closeModal) {
      delete clickHandlers.closeModal;
    }
    this.update({upsellModal: type});
    window.setTimeout(() => this.onClickOutside(`mp-upsell-modal`, `closeModal`), 100);
  }

  closeModal() {
    this.update({upsellModal: null});
  }

  maybeCloseUpsellModal(ev, type) {
    const maybeCloseFeature = ev.target.attributes[`feature`].value;
    if (maybeCloseFeature === type && ev.detail && ev.detail.state === `closed`) {
      this.closeModal();
    }
  }

  hasWhitelist(name) {
    return this.mpContext && this.mpContext.whitelists && this.mpContext.whitelists.includes(name);
  }

  getFlag(name) {
    return this.mpContext && this.mpContext.whitelists && this.mpContext.flags[name];
  }


  /**
   * initialize app with data/settings from mixpanel.com if available
   */

  setMPContext(mpContext) {
    this.mpContext = mpContext;

    this.shouldViewOnboarding = this.mpContext.flags && !this.mpContext.flags.VIEWED_INSIGHTS_INTRO;
    this.standalone = this.mpContext.standalone;
    this.customEvents = this.mpContext.customEvents || [];
    this.hasWritePermissions = !this.mpContext.hasPermissions || this.mpContext.permissions.includes(`write_insights`);
    this.projectHasEvents = true;
    this.userID = this.mpContext.userID;
    this.projectID = this.mpContext.projectID;
    this.accessToken = this.mpContext.accessToken;
    this.dashboardTags = this.mpContext.dashboardTags || [];
    this.bookmarks = this.mpContext.bookmarks || [];

    if (!this.standalone) {
      this.projectHasEvents = !!this.mpContext.hasIntegratedArb;
      Object.assign(this.state, {
        savedReports: this.mpContext.bookmarks.reduce(
          (reports, bm) => extend(reports, {[bm.id]: Report.fromBookmarkData(bm)}),
          {}
        ),
      });
    }
  }

  attachedCallback() {
    this.state.projectHasEvents = this.projectHasEvents;
    this.state.recentEvents = this._getRecentList(`events`);
    this.state.recentProperties = this._getRecentList(`properties`);

    this.queries = {};
    if (this.canMakeQueries()) {
      const apiAttrs = {
        apiHost: this.apiHost,
        apiSecret: this.apiSecret,
      };
      this.queries = {
        topEvents: new TopEventsQuery(apiAttrs),
        topEventProperties: new TopEventPropertiesQuery(apiAttrs),
        topEventPropertyValues: new TopEventPropertyValuesQuery(apiAttrs),
        topPeopleProperties: new TopPeoplePropertiesQuery(apiAttrs),
        topPeoplePropertyValues: new TopPeoplePropertyValuesQuery(apiAttrs),
        topPropertyValuesCache: new QueryCache(),
        segmentation: new SegmentationQuery(apiAttrs, {customEvents: this.customEvents}),
        segmentationCache: new QueryCache(),
      };
    }

    super.attachedCallback(...arguments);

    if (this.shouldViewOnboarding) {
      this.navigate(`learn`);
    } else if (this.state.report.id) {
      this.navigate(`report/${this.state.report.id}`);
    }
  }

  navigateToSetup() {
    this.trackEvent(`No Data - Click Install Mixpanel`)
      .then(() => {
        if (this.mpContext.setupURL) {
          window.location.pathname = this.mpContext.setupURL;
        }
      });
  }

  // Serialization helpers

  // TODO update mixpanel-common to allow configurable persistence namespace
  get persistence() {
    if (!this._persistence) {
      let namespaceVars = [this.persistenceKey];
      if (this.mpContext.projectID) {
        namespaceVars = namespaceVars.concat([
          this.mpContext.projectID,
          this.mpContext.userID,
        ]);
      }
      this._persistence = new Persistence(namespaceVars.join(`:`));
    }
    return this._persistence;
  }

  get persistenceKey() {
    // TODO rename to insights- at next format change
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
    value = util.pick(value, [`name`, `type`, `resourceType`]);

    const stateKey = type === `events` ? `recentEvents` : `recentProperties`;
    this.update({[stateKey]: [
      value, ...this.state[stateKey].filter(oldValue => !isEqual(value, oldValue)),
    ].slice(0, 10)});
    this.persistence.set(this._getRecentPersistenceKey(type), JSON.stringify(this.state[stateKey]));
  }

  // Report management

  urlForReportId(reportID) {
    let title = this.state.savedReports[reportID] && this.state.savedReports[reportID].title;
    title = title ? kebabCase(title) : ``;
    return `report/${reportID}/${title}`;
  }

  openReportList() {
    this.update({reportsDrawerOpen: true});
    this.trackEvent(`Report list - open`);
  }

  chooseReport(report) {
    this.navigate(this.urlForReportId(report.id));
    this.trackEvent(`Report list - select report`, {'report id': report.id});
  }

  deleteReport(report) {
    const reportTrackingData = report.toTrackingData();
    this.mpContext.deleteBookmark(report.id)
      .then(() => {
        delete this.state.savedReports[report.id];
        if (this.state.report.id === report.id) {
          this.navigate(``);
        } else {
          this.update();
        }
      })
      .catch(err => {
        console.error(`Error deleting: ${err}`);
        reportTrackingData.error = err;
      })
      .then(() => this.trackEvent(`Delete Report`, reportTrackingData));
  }

  loadReport(report, {trackLoading=false}={}) {
    const stateUpdate = extend(this.resettableState, report ? {report: report.clone()} : {});
    this.update(stateUpdate);
    this.resetTopQueries();
    if (trackLoading) {
      this.trackEvent(`Load Report`, report ? report.toTrackingData() : {});
    }
    return stateUpdate;
  }

  saveReport({saveAsNew=false, newReportData={}}={}) {
    const reportTrackingData = this.state.report.toTrackingData();
    return this.mpContext.saveBookmark(this.state.report.toBookmarkData({saveAsNew, newReportData}))
      .then(bookmark => {
        const report = Report.fromBookmarkData(bookmark);
        this.update({savedReports: extend(this.state.savedReports, {[report.id]: report})});
        this.navigate(this.urlForReportId(report.id), {report});
        Object.assign(reportTrackingData, {
          'new report': !this.state.savedReports.hasOwnProperty(report.id),
          'report title': report.title,
          'report id': report.id,
        });
      })
      .catch(err => {
        console.error(`Error saving: ${err}`);
        if(err.toString().includes(`At saved report limit`)) {
          this.openUpsellModal(`saveReport`);
        }
        reportTrackingData.error = err;
      })
      .then(() => {
        this.trackEvent(`Save Report`, reportTrackingData);
        if (reportTrackingData.error) {
          return Promise.reject(reportTrackingData.error);
        }
      });
  }

  // New query builder helpers

  get defaultBuilderState() {
    return {
      activeIndex: 0,
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

  startBuilderOnScreen(componentName, {previousScreens=[], screenAttrs={}}={}) {
    const hasExistingScreens = !!this.state.builderPane.screens.length;
    const currScreen = extend({componentName}, screenAttrs);
    const prevScreens = previousScreens.map(componentName => ({componentName}));
    const screens = [...prevScreens, currScreen];

    this.resetBuilder();
    this.stopEditingClause();
    if (hasExistingScreens) {
      this.updateBuilder({inTransition: true}, {screens});
    } else {
      this.updateBuilder({screens});
    }
  }

  buildScreenSpecificSelector(selector) {
    const tagName = this.getBuilderCurrentScreen().componentName;
    return tagName + ` ` + selector;
  }

  setActiveIndex(newIndex, {scrollIntoView=true}={}) {
    this.updateBuilder({activeIndex: newIndex});
    const listEl = this.el.querySelector(this.buildScreenSpecificSelector(`.arrow-key-scrollable`));

    if (scrollIntoView && listEl) {
      window.requestAnimationFrame(() => {
        const activeEl = this.el.querySelector(`.list-option-active`);
        if (activeEl) {
          const screenTitle = this.el.querySelector(`.screen-title`);
          const resourceControl = this.el.querySelector(`.resource-type-control`);
          const viewportBottom = listEl.scrollTop + listEl.offsetHeight;
          const activeElBottom = activeEl.offsetTop + activeEl.offsetHeight;
          const headerHeight = (screenTitle ? screenTitle.offsetHeight : 0) + (resourceControl ? resourceControl.offsetHeight : 0);
          if (activeEl.offsetTop - headerHeight < listEl.scrollTop) {
            listEl.scrollTop = activeEl.offsetTop - headerHeight - 8;
          } else if (activeElBottom > viewportBottom) {
            listEl.scrollTop = activeElBottom - listEl.offsetHeight + 8;
          }
        }
      });
    }
  }

  handleKeydown(e) {
    const activeIdx = this.state.builderPane.activeIndex;
    const items = this.el.querySelectorAll(this.buildScreenSpecificSelector(`.list-option`));
    const itemCount = items.length;

    const pill = this.el.querySelector(this.buildScreenSpecificSelector(`.list-option-active .pill`));
    const activePillClass = `pill-active`;

    switch(e.keyCode) { // tab
      case util.KEY_CODES.tab: {
        e.preventDefault();
        if (pill) {
          pill.classList.toggle(activePillClass);
        } else {
          items[activeIdx].click();
        }
        break;
      }
      case util.KEY_CODES.enter: // enter
        if (pill && pill.classList.contains(activePillClass)) {
          pill.click();
        } else {
          items[activeIdx].click();
        }
        break;
      case util.KEY_CODES.upArrow: { // up arrow
        e.preventDefault();
        if (activeIdx !== 0) {
          this.setActiveIndex(activeIdx - 1);
        }
        break;
      }
      case util.KEY_CODES.downArrow: { // down arrow
        e.preventDefault();
        if (activeIdx < itemCount - 1) {
          this.setActiveIndex(activeIdx + 1);
        }
        break;
      }
    }
  }

  stopBuildingQuery() {
    this.stopEditingClause();
    // time for menu to close
    setTimeout(() => this.resetBuilder(), 250);
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

  getBuilderCurrentScreenAttr(attr) {
    const screen = this.getBuilderCurrentScreen();
    return screen && screen[attr];
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
      && this.state.stageClauses[0]
      && this.state.stageClauses[0].resourceType === `people`;
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
    if (this.state.learnActive) {
      const step = util.getLearnStep(this.state.report, this.state.learnModalStepIndex);
      properties = extend(properties, {
        'Onboarding': true,
        'Onboarding Location': step.trackName,
      });
    }

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
    return this.getClausesForType(type).map(clause => clause.value);
  }

  getTimeClauseValue(clause) {
    clause = clause || this.getClausesForType(TimeClause.TYPE)[0];
    const {value, unit, range} = clause;
    let from = null;
    let to = null;

    if (Number.isInteger(value)) {
      from = util.formatDate(util.relativeToAbsoluteDate(value, unit), {iso: true});
      to = util.formatDate(util.relativeToAbsoluteDate(0, unit), {iso: true});
    } else if (Array.isArray(value)) {
      [from, to] = value;
      if (Number.isInteger(from)) {
        from = util.formatDate(util.relativeToAbsoluteDate(from, unit), {iso: true});
      }
      if (Number.isInteger(to)) {
        to = util.formatDate(util.relativeToAbsoluteDate(to, unit), {iso: true});
      }
    }

    return {from, to, unit, range};
  }

  isShowingTimeClauseCustomControls() {
    const currentScreen = this.getBuilderCurrentScreenAttr(`componentName`);
    return screen && currentScreen === `builder-screen-time-custom`;
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
    const oldUrlData = this.state.report.toUrlData();
    const report = Object.assign(this.state.report, attrs);
    const newUrlData = report.toUrlData();

    const isPeopleAndNotTimeSeries = report.sections.show.isPeopleOnlyQuery() && !report.sections.group.isPeopleTimeSeries();
    if (isPeopleAndNotTimeSeries && report.displayOptions.chartType === `line`) {
      report.displayOptions.chartType = `bar`;
    }
    this.update({report});

    const nextLearnStep = util.getLearnStep(this.state.report, this.state.learnModalStepIndex);
    const prevLearnStep = util.getLearnStep(this.state.report, this.state.learnModalStepIndex);
    if (this.state.learnActive && prevLearnStep.name !== nextLearnStep.name) {
      this.transitionLearn();
    } else if (!isEqual(oldUrlData, newUrlData)) {
      history.replaceState(null, null, `#${JSURL.stringify(newUrlData)}`);
    }
  }

  updateStickyHeader(attrs) {
    this.update({stickyHeader: extend(this.state.stickyHeader, attrs)});
  }

  resetQuery() {
    history.replaceState(null, null, `#`);
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

  updateStageClause(clauseData={}, {shouldCommit=false, shouldStopEditing=true}={}) {
    const stageClauses = this.state.stageClauses.concat();
    let currentClause = stageClauses.pop();
    if (currentClause) {
      stageClauses.push(currentClause.extend(clauseData));
    }
    let newState = {stageClauses};

    // query new property values if we're setting a new filter property
    const activeStageClause = this.activeStageClause;
    if (activeStageClause && activeStageClause.TYPE === `filter` && clauseData.value) {
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

    if (shouldCommit) {
      this.commitStageClause({shouldStopEditing});
    }
  }

  commitStageClause({shouldStopEditing=true}={}) {
    const reportTrackingData = this.state.report.toTrackingData();
    const newClauses = this.state.stageClauses;
    const reportAttrs = extend(this.state.report);

    if (newClauses.length) {
      let shouldClearAllGroupsAndFilters = false;
      newClauses.filter(clause => clause.valid).forEach(clause => {
        const newClause = clause.extend();
        let newSection = null;
        const isEditingClause = clause === newClauses[0] && typeof this.state.stageClauseIndex === `number`;

        const isPeopleShowClause = newClause.TYPE === ShowClause.TYPE && newClause.resourceType === Clause.RESOURCE_TYPE_PEOPLE;
        if (isPeopleShowClause && reportAttrs.displayOptions.chartType === `line`) {
          reportAttrs.displayOptions.chartType = `bar`;
        }

        if (isEditingClause) {
          newSection = reportAttrs.sections[newClause.TYPE].replaceClause(this.state.stageClauseIndex, newClause);
          if (newClause.TYPE === ShowClause.TYPE) {
            if (this.state.stageClauseIndex === 0) {
              shouldClearAllGroupsAndFilters = newClause.resourceType !== reportAttrs.sections.show.clauses[0].resourceType;
            }
            if (newClause.property && newClause.math === ShowClause.MATH_TYPE_UNIQUE) {
              newClause.math = ShowClause.MATH_TYPE_TOTAL;
            }
          }
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

      if (shouldClearAllGroupsAndFilters) {
        reportAttrs.sections = reportAttrs.sections.replaceSection(new GroupSection());
        reportAttrs.sections = reportAttrs.sections.replaceSection(new FilterSection());
      }

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

  updateShowClauseButtonPosition(key, buttonOutside) {
    let showClauseButtonPosition = this.state.showClauseButtonPosition;
    showClauseButtonPosition[key] = buttonOutside;
    this.update({showClauseButtonPosition});
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

          this.update({
            result,
            newCachedData: false,
            resultLoading: false,
            report: Object.assign(this.state.report, {
              sorting: this.sortConfigFor(result, this.state.report.sorting),
              legend: this.state.report.legend.updateLegendData(result),
            }),
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
