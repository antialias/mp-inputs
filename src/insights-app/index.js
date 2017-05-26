import JSURL from 'jsurl';
import isEqual from 'lodash/isEqual';
import kebabCase from 'lodash/kebabCase';
import MPApp from 'mixpanel-common/report/mp-app';
import Persistence from 'mixpanel-common/report/persistence';
import {commaizeNumber, extend, pick} from 'mixpanel-common/util';
import {unique} from 'mixpanel-common/util/array';
import ItemsMenu from 'mixpanel-common/widgets/items-menu';
import * as util from '../util';

import {mixpanel, rollbar} from '../tracking';

import BuilderSections from '../models/builder-sections';
import {Clause, GroupClause, ShowClause, TimeClause} from '../models/clause';
import {DATASETS, DATASET_MIXPANEL} from '../models/constants';
import {FilterSection, GroupSection, ShowSection, TimeSection} from '../models/section';
import Legend from '../models/legend';
import BaseQuery from '../models/queries/base';
import TopEventsQuery from '../models/queries/top-events';
import {TopEventPropertiesQuery, TopPeoplePropertiesQuery} from '../models/queries/top-properties';
import {TopEventPropertyValuesQuery, TopPeoplePropertyValuesQuery} from '../models/queries/top-property-values';
import {EventDefinitionsQuery} from '../models/queries/event-definitions';
import SegmentationQueryOldApi from '../models/queries/segmentation';
import SegmentationQueryNewApi from '../models/queries/segmentation-new-api';
import {SmartHubGetAlertsByContentIdsQuery} from '../models/queries/smart-hub';
import QueryCache from '../models/queries/query-cache';
import DatasetsQuery from '../models/queries/datasets';
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
const FEATURE_GATES_UNLIMITED = 9223372036854776000; //python max int, aka featureGates.unlimited

const TOP_EVENTS = `_topEvents`;
const TOP = {
  PROPERTY_VALUES: `_topPropertyValues`,
  EVENTS: {
    PROPERTIES: `_topEventsProperties`,
    PROPERTY_VALUES: `_topEventsPropertyValues`,
    PROPERTIES_BY_EVENT: `_topEventsPropertiesByEvent`,
  },
  PEOPLE: {
    PROPERTIES: `_topPeopleProperties`,
    PROPERTY_VALUES: `_topPeoplePropertyValues`,
  },
};
const RECENT = {
  EVENTS: `_recentEvents`,
  PROPERTIES: `_recentProperties`,
};
const SMART_HUB = {
  GET_ALERTS_BY_CONTENT_IDS: `_getAlertsByContentIds`,
};

document.registerElement(`insights-app`, class InsightsApp extends MPApp {
  get config() {
    return {
      template,
      defaultState: extend(
        this.resettableState,
        {
          // The following states should persist through reset.
          datasets: { // every project has at least a Mixpanel dataset
            [DATASET_MIXPANEL]: DATASETS[DATASET_MIXPANEL],
          },
          canAddBookmark: true,
          features: {},
          savedReports: {},
          eventDefinitions: [],
          [RECENT.EVENTS]: [],
          [RECENT.PROPERTIES]: [],
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
            stateUpdate = extend(stateUpdate, this.loadReport(report, {trackLoading: true}), {unsavedChanges: false});
          }
          return stateUpdate;
        }
      },

      index: (stateUpdate={}) => {
        if (this.state.report.id) {
          stateUpdate = extend(stateUpdate, this.resetQuery());
        } else if (!stateUpdate.report && this.canMakeQueries()) {
          this._fetchAllDatasetsTopEventsAndProperties();
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
          // pass down custom event sync function so clauses can get the latest version of each custom event
          const report = Report.deserialize(extend(this.defaultReportState(), parsedURL), this.syncCustomEvent);
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
      report: this.defaultReportState(),
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
      showClauseWidths: {},
      groupClauseWidths: {},
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
      smartHubAlerts: [],
      stageClauses: [],
      stickyHeader: {},
      [TOP_EVENTS]: {},
      [TOP.EVENTS.PROPERTIES]: {},
      [TOP.EVENTS.PROPERTIES_BY_EVENT]: {},
      [TOP.PEOPLE.PROPERTIES]: {},
      [TOP.PROPERTY_VALUES]: {},
      upsellModal: null,
      unsavedChanges: true,
    };
  }

  defaultReportState(dataset=null) {
    const eventsBlocked = this.state && this.state.blocking && this.state.blocking.isBlockedEvents;
    const eventsIntegrated = this.state && this.state.projectHasEvents;
    const peopleBlocked = this.state && this.state.blocking && this.state.blocking.isBlockedPeople;
    const peopleIntegrated = this.state && this.state.projectHasPeople;
    // no access to events, but has access to people
    const defaultQueryPeople = (eventsBlocked || !eventsIntegrated) && (peopleIntegrated && !peopleBlocked);

    const defaultShowClause = defaultQueryPeople ? ShowClause.ALL_PEOPLE : ShowClause.TOP_EVENTS;
    const resourceType = defaultQueryPeople ? Clause.RESOURCE_TYPE_PEOPLE : Clause.RESOURCE_TYPE_EVENTS;

    return new Report({
      alertContentIds: [],
      displayOptions: {
        chartType: `bar`,
        plotStyle: `standard`,
        analysis: `linear`,
        value: `absolute`,
      },
      sections: new BuilderSections({
        show: new ShowSection(new ShowClause({value: defaultShowClause, resourceType, dataset})),
        time: new TimeSection(new TimeClause({range: TimeClause.RANGES.HOURS, dataset})),
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
    return feature === `can_export_csv` ? true :  FEATURE_GATES_UNLIMITED;
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
    window.requestAnimationFrame(() => {
      this.update({upsellModal: type});
    });
  }

  maybeCloseUpsellModal(ev, modalName=null) {
    if (modalName === null) { // called from clickOutsideHandler
      this.update({upsellModal: null});
    } else { // called from a helper function when a modal was closed intentionally
      const eventOriginModalName = ev.target.attributes[`name`].value;
      const eventMatchesCurrentModal = eventOriginModalName === this.state.upsellModal;
      const isModalClosed = ev.detail && ev.detail.state === `closed`;
      if (eventMatchesCurrentModal && isModalClosed) {
        this.update({upsellModal: null});
      }
    }
  }

  shouldUpsellForSource(source) {
    let overFreeQuota = false;
    switch(source) {
      case `events`:
        overFreeQuota = !this.state.isPayingCustomer && this.state.blocking.isBlockedEvents;
        break;
      case `people`:
        overFreeQuota = !this.state.isPayingCustomer && this.state.blocking.isBlockedPeople;
    }
    return overFreeQuota;
  }

  shouldAlertForSource(source) {
    let shouldAlert = false;
    let notIntegrated, missedPayment;
    switch(source) {
      case `events`:
        notIntegrated = !this.state.projectHasEvents;
        missedPayment = this.state.isPayingCustomer && this.state.blocking.isBlockedEvents;
        shouldAlert = !this.shouldUpsellForSource(source) && (notIntegrated || missedPayment);
        break;
      case `people`:
        notIntegrated = !this.state.projectHasPeople;
        missedPayment = this.state.isPayingCustomer && this.state.blocking.isBlockedPeople;
        shouldAlert = !this.shouldUpsellForSource(source) && (notIntegrated || missedPayment);
    }
    return shouldAlert;
  }

  upsellTextOptions(resourceType) {
    const cap = commaizeNumber(this.mpContext[`${resourceType}Plan`].cap);
    const customerType = this.state.isPayingCustomer ? `converted` : `free`;
    const upsellType = this.shouldUpsellForSource(resourceType) ? `upsell` : `alert`;
    return util.upsellOptions({
      cap,
      customerType,
      resourceType,
      upsellType,
    });
  }

  hasWhitelist(name) {
    const whitelists = this.mpContext && this.mpContext.whitelists;
    return whitelists && whitelists.includes(name);
  }

  hasProjectFeatureFlag(name) {
    const flags = this.mpContext && this.mpContext.projectFeatureFlags;
    return flags && flags.includes(name);
  }

  hasPermission(name) {
    const permissions = this.hasProjectFeatureFlag(`permissions`) && this.mpContext.permissions;
    return permissions && permissions.includes(name);
  }

  getFlag(name) {
    return this.mpContext && this.mpContext.flags && this.mpContext.flags[name];
  }

  getUtcOffset() {
    return this.mpContext.utcOffset;
  }

  /**
   * initialize app with data/settings from mixpanel.com if available
   */

  setMPContext(mpContext) {
    this.mpContext = mpContext;

    this.shouldViewOnboarding = this.mpContext.flags && !this.getFlag(`VIEWED_INSIGHTS_INTRO`);
    this.standalone = this.mpContext.standalone;
    this.hasWritePermissions = !this.hasProjectFeatureFlag(`permissions`) || this.hasPermission(`write_insights`);
    this.eventsPlan = {cap: FEATURE_GATES_UNLIMITED};
    this.peoplePlan = {cap: FEATURE_GATES_UNLIMITED};
    this.userID = this.mpContext.userID;
    this.projectID = this.mpContext.projectID;
    this.accessToken = this.mpContext.accessToken;
    this.dashboardTags = this.mpContext.dashboardTags || [];
    this.bookmarks = this.mpContext.bookmarks || [];

    this.customEvents = this.mpContext.customEvents || [];
    const customEventsIdMap = {};
    const customEventsNameMap = {};
    this.customEvents.forEach(ce => {
      ce.custom = true;
      if (ce.id) {
        customEventsIdMap[ce.id] = ce;
      }
      if (ce.name) {
        customEventsNameMap[ce.name] = ce;
      }
    });
    // provide method of pulling latest custom event data in case a custom event was modified since the last time the report was saved
    this.syncCustomEvent = ce => extend(ce, customEventsIdMap[ce.id] || customEventsNameMap[ce.name]);

    this.updateCanAddBookmark = () => {
      new Promise(resolve => {
        if (this.mpContext.canAddBookmark) {
          return resolve(this.mpContext.canAddBookmark());
        } else {
          return resolve(true);
        }
      }).then(canAddBookmark => this.update({canAddBookmark}));
    };

    if (!this.standalone) {
      Object.assign(this.state, {
        savedReports: this.mpContext.bookmarks.reduce(
          (reports, bm) => extend(reports, {[bm.id]: Report.fromBookmarkData(bm)}),
          {}
        ),
      });
    }
  }

  attachedCallback() {
    this.state.projectHasEvents = this.mpContext.hasOwnProperty(`hasIntegratedArb`) ? this.mpContext.hasIntegratedArb : true;
    this.state.projectHasPeople = this.mpContext.hasOwnProperty(`hasIntegratedEngage`) ? this.mpContext.hasIntegratedEngage : true;
    const blocking = this.mpContext.blocking || {};
    const {
      is_blocked_events: isBlockedEvents = false,
      is_blocked_people: isBlockedPeople = false,
      label = ``,
    } = blocking;
    this.state.blocking = {isBlockedEvents, isBlockedPeople, label};
    this.state[RECENT.EVENTS] = this._loadRecentListFromPersistence(`events`);
    this.state[RECENT.PROPERTIES] = this._loadRecentListFromPersistence(`properties`);
    this.state.isPayingCustomer = [`billing_error_blocked_owner`, `billing_error_blocked_member`].includes(this.state.blocking.label);

    this.queries = {};
    if (this.canMakeQueries()) {
      const apiAttrs = {
        apiHost: this.apiHost,
        apiSecret: this.apiSecret,
        projectId: this.projectID,
      };
      const appApiAttrs = {
        apiHost: this.apiHost,
        accessToken: this.accessToken,
        projectId: this.projectID,
      };

      this.queries = {
        datasets: new DatasetsQuery(apiAttrs),
        segmentation: new SegmentationQueryNewApi(apiAttrs, {utcOffset: this.getUtcOffset()}),
        eventDefinitions: new EventDefinitionsQuery(appApiAttrs),
        [SMART_HUB.GET_ALERTS_BY_CONTENT_IDS]: new SmartHubGetAlertsByContentIdsQuery(appApiAttrs),
        [TOP_EVENTS]: new TopEventsQuery(apiAttrs),
        [TOP.EVENTS.PROPERTIES]: new TopEventPropertiesQuery(apiAttrs),
        [TOP.PEOPLE.PROPERTIES]: new TopPeoplePropertiesQuery(apiAttrs),
        [TOP.EVENTS.PROPERTY_VALUES]: new TopEventPropertyValuesQuery(apiAttrs),
        [TOP.PEOPLE.PROPERTY_VALUES]: new TopPeoplePropertyValuesQuery(apiAttrs),
      };

      this.caches = {
        segmentation: new QueryCache(),
        [TOP_EVENTS]: new QueryCache(),
        [TOP.EVENTS.PROPERTIES]: new QueryCache(),
        [TOP.PEOPLE.PROPERTIES]: new QueryCache(),
        [TOP.EVENTS.PROPERTY_VALUES]: new QueryCache(),
        [TOP.PEOPLE.PROPERTY_VALUES]: new QueryCache(),
      };

      // TODO @evnp 5/16/17: TEMP DEBUG CODE - remove when we switch fully to new Insights API
      if (this.useOldApi || this.compareApis) {
        this.queries.oldApiSegmentation = new SegmentationQueryOldApi(apiAttrs, {
          customEvents: this.customEvents,
          utcOffset: this.getUtcOffset(),
        });
      }

      if (this.useOldApi) {
        this.queries.segmentation = this.queries.oldApiSegmentation;
      }
      // END DEBUG CODE
    }

    this._getEventDefinitions();
    this.updateCanAddBookmark();

    super.attachedCallback(...arguments);

    if (this.shouldViewOnboarding) {
      this.navigate(`learn`);
    } else if (this.state.report.id) {
      this.navigate(`report/${this.state.report.id}`);
    }

    this.onClickOutside(`mp-upsell-modal`, `maybeCloseUpsellModal`);
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
    return attrs.sections ? {report: Report.deserialize(extend(this.defaultReportState(), attrs))} : {};
  }

  getRecentEvents() {
    return this._getRecentList(`events`, this.getDataset());
  }

  getRecentProperties() {
    return this._getRecentList(`properties`, this.getDataset());
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

  _sanitizeRecentList(list) {
    // LEGACY - support persisted recent data from pre-datasets world
    list = list.map(item => extend({dataset: DATASET_MIXPANEL}, item));

    // remove any match data from value object
    // custom, id, alternatives are needed to get custom events to correctly work
    // is_collect_everything_event is needed to show correct icon in recent events list
    const recentItemFields = [`name`, `type`, `resourceType`, `profileTypes`, `dataset`, `custom`, `id`, `alternatives`, `is_collect_everything_event`];
    list = list.map(item => pick(item, recentItemFields));

    // remove special events and properties from recent item list
    const specialEventsAndProps = [...ShowClause.SPECIAL_EVENTS, ...GroupClause.SPECIAL_PROPERTIES];
    list = list.filter(eventOrProperty => !specialEventsAndProps.find(special =>
      eventOrProperty.name === special.name &&
      eventOrProperty.type === special.type &&
      eventOrProperty.resourceType === special.resourceType
    ));

    // ensure recent item list is unique
    const hash = value => recentItemFields.map(field => value[field]).join(`:`);
    list = unique(list, {hash});

    return list;
  }

  _loadRecentListFromPersistence(type) {
    let list;

    try {
      list = JSON.parse(this.persistence.get(this._getRecentPersistenceKey(type)));
    } catch (err) {
      console.error(`Error parsing recent ${type} from persistence: ${err}`);
    }

    return this._sanitizeRecentList(list || []);
  }

  _getRecentList(type, dataset=null) {
    let list = this.state[type === `events` ? RECENT.EVENTS : RECENT.PROPERTIES];

    if (dataset) {
      list = list.filter(item => item.dataset === dataset);
    }

    this.persistence.set(this._getRecentPersistenceKey(type), JSON.stringify(list));

    return list;
  }

  _getEventDefinitions() {
    if (this.hasProjectFeatureFlag(`data_definitions`)) {
      this.queries.eventDefinitions.build(this.state).executeQuery().then(response => {
        this.update({eventDefinitions: response.results});
      });
    }
  }

  _updateRecentList(type, value) {
    const stateKey = type === `events` ? RECENT.EVENTS : RECENT.PROPERTIES;

    this.update({
      [stateKey]: this._sanitizeRecentList([value, ...this.state[stateKey]]),
    });
  }

  getBookmark(report) {
    return this.app.bookmarks.find(bm => bm.id === report.id);
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
    let stateUpdate = this.resettableState;

    if (report) {
      // pass down custom event sync function so clauses can get the latest version of each custom event
      stateUpdate = extend(stateUpdate, {report: report.clone(this.syncCustomEvent)});
    }

    this.update(stateUpdate);

    if (this.canMakeQueries()) {
      this._fetchAllDatasetsTopEventsAndProperties();
    }

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
        this.updateCanAddBookmark();
        this.update({
          savedReports: extend(this.state.savedReports, {[report.id]: report}),
          unsavedChanges: false,
        });
        this.navigate(this.urlForReportId(report.id), {report: new Report(report)});
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
    const update = {
      screens: [...prevScreens, currScreen],
      activeIndex: prevScreens.length,
    };

    this.resetBuilder();
    this.stopEditingClause();

    if (hasExistingScreens) {
      this.updateBuilder({inTransition: true}, update);
    } else {
      this.updateBuilder(extend(update, {noAnimate: true}), {noAnimate: false});
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
    const itemsMenuEl = this.el.querySelector(this.buildScreenSpecificSelector(`mp-items-menu`));
    if (itemsMenuEl) {
      if (Object.values(ItemsMenu.NAVIGATION_KEY_CODES).indexOf(e.keyCode) !== -1) {
        e.preventDefault();
        e.stopPropagation();

        // There's a bug in chrome where it's not possible to set keyCode on KeyboardEvent,
        // so use a CustomEvent instead
        const clonedEvent = new Event(e.type, e);
        clonedEvent.keyCode = e.keyCode;
        itemsMenuEl.dispatchEvent(clonedEvent);
      }
    } else {
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
  }

  stopBuildingQuery() {
    this.stopEditingClause();
    // time for menu to close
    setTimeout(() => this.resetBuilder(), 250);
  }

  resetBuilder() {
    this.updateBuilder(this.defaultBuilderState);
  }

  updateBuilder(attrs, postTransitionAttrs) {
    this.update({builderPane: extend(this.state.builderPane, attrs)});
    if (attrs.inTransition || postTransitionAttrs) {
      setTimeout(() => {
        this.updateBuilder(extend(postTransitionAttrs || {}, {inTransition: false}));
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

  get originStageClause() {
    return this.hasStageClause() ? this.state.stageClauses[0] : null;
  }

  originStageClauseValue(valueKey) {
    return this.originStageClause && this.originStageClause[valueKey];
  }

  originStageClauseType() {
    return this.originStageClauseValue(`TYPE`);
  }

  originStageClauseResourceType() {
    return this.originStageClauseValue(`resourceType`);
  }

  originStageClauseIsPeopleProperty() {
    return this.originStageClauseResourceType() === Clause.RESOURCE_TYPE_PEOPLE;
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

  isContextualPaneOpen() {
    return (
      this.state.builderPane.screens.length &&
      this.state.builderPane.isContextualMenuOpen &&
      this.state.stageClauseIndex === null
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
    return this.state.projectHasEvents || this.state.projectHasPeople;
  }

  getClausesForType(type) {
    return (this.state.report && this.state.report.sections[type].clauses) || [];
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
      const utcOffset = this.getUtcOffset();
      from = util.formatDate(util.relativeToAbsoluteDate(value, unit, {utcOffset}), {iso: true});
      to = util.formatDate(util.relativeToAbsoluteDate(0, unit, {utcOffset}), {iso: true});
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

  // Datasets management

  /**
   * dataset that should be used for the insights report
   * @returns {string}
   */
  getDataset() {
    // If this is not a multi dataset project or no user selection made, always default to 'mixpanel'
    return this.getSelectedDataset() || DATASET_MIXPANEL;
  }

  /**
   * This is the dataset that the user selected from the datasets dropdown in show clause
   * null means no selection has been made
   * @returns {string | null}
   */
  getSelectedDataset() {
    const clause = this.getClausesForType(ShowClause.TYPE)[0];
    return (clause && clause.dataset) || null;
  }

  getDatasetsInfo() {
    const datasets = this.state.datasets;
    return Object.keys(datasets).map(
      datasetName => extend(datasets[datasetName], {datasetName}));
  }

  getDatasetDisplayName() {
    if (this.hasDatasets()) {
      const dataset = this.getDataset();
      if (dataset) {
        return this.state.datasets[dataset].displayName;
      }
    }

    return null;
  }

  hasDatasets() {
    return this.state.datasets && Object.keys(this.state.datasets).length > 1;
  }

  _fetchAllDatasetsTopEventsAndProperties() {
    // Fetch top events and properties for current dataset without waiting for datasets list
    const currDataset = this.getDataset();
    this._fetchTopEventsAndProperties(currDataset);

    if (this.hasProjectFeatureFlag(`sst`)) {
      this.queries.datasets.build(this.state).run().then(datasets => {
        this.update({datasets: extend(this.state.datasets, datasets)});

        // Fetch top events and properties for all other datasets
        Object.keys(this.state.datasets)
          .filter(dataset => dataset !== currDataset)
          .forEach(dataset => this._fetchTopEventsAndProperties(dataset));
      });
    }
  }

  updateSelectedDataset(dataset) {
    let sections = this.defaultReportState(dataset).sections;
    const oldTimeClause = this.getClausesForType(TimeClause.TYPE)[0];
    const newTimeSection = new TimeSection(oldTimeClause);

    this.updateReport({
      sections: sections.replaceSection(newTimeSection), // retain previous time clause
    });

    // Reset staging clause so it picks up new dataset
    this.stopEditingClause();
    this.startEditingClause(ShowClause.TYPE, 0);
  }

  // Sources managment (Mixpanel: [events, people], Salesforce: [events, accounts, contacts, leads], etc.)

  getSources(resourceType=null, dataset=null) {
    dataset = dataset || this.getDataset();
    const datasetInfo = this.state.datasets[dataset];
    const profileTypes = (datasetInfo && datasetInfo.profileTypes) || [Clause.RESOURCE_TYPE_PEOPLE];
    const allSource = {
      name: Clause.RESOURCE_TYPE_ALL,
      resourceType: Clause.RESOURCE_TYPE_ALL,
    };
    const eventsSource = {
      name: Clause.RESOURCE_TYPE_EVENTS,
      resourceType: Clause.RESOURCE_TYPE_EVENTS,
    };
    const peopleSources = profileTypes.map(profileType => ({
      name: profileType,
      resourceType: Clause.RESOURCE_TYPE_PEOPLE,
      profileType,
    }));

    if (resourceType === Clause.RESOURCE_TYPE_EVENTS) {
      return [eventsSource];
    } else if (resourceType === Clause.RESOURCE_TYPE_PEOPLE) {
      return peopleSources;
    } else {
      return [allSource, eventsSource, ...peopleSources];
    }
  }

  getSelectedSource(clause=null) {
    clause = clause || this.state.report.sections.show.clauses[0];
    return (clause && clause.source) || Clause.RESOURCE_TYPE_EVENTS;
  }

  filterPropertiesBySource(source) {
    return property => {
      if (property) {
        if (source === Clause.RESOURCE_TYPE_ALL) {
          return true;
        }

        if (property.resourceType === Clause.RESOURCE_TYPE_EVENTS) {
          return property.resourceType === source;
        }

        if (property.resourceType === Clause.RESOURCE_TYPE_PEOPLE) {
          return property.resourceType === source || (
            property.profileTypes && property.profileTypes.includes(source)
          );
        }
      }

      return false;
    };
  }

  // Top events/properties management

  getTopEvents(dataset=null) {
    return this._constructTopList(TOP_EVENTS, dataset);
  }

  getTopEventProperties(mpEvent=null, dataset=null) {
    if (mpEvent) {
      dataset = dataset || this.getDataset();
      const properties = this.state[TOP.EVENTS.PROPERTIES_BY_EVENT][dataset];
      return (properties && properties[util.formatEventName(mpEvent)]) || null;
    } else {
      return this._constructTopList(TOP.EVENTS.PROPERTIES, dataset);
    }
  }

  getTopPeopleProperties(dataset=null) {
    return this._constructTopList(TOP.PEOPLE.PROPERTIES, dataset);
  }

  getTopPropertyValues(dataset=null) {
    return this._constructTopList(TOP.PROPERTY_VALUES, dataset);
  }

  /**
   * Constructs top properties / event list
   * @param {string} topKey - A key from TOP constant e.g TOP.PROPERTY_VALUE or TOP.PEOPLE.PROPERTIES
   * @param {string | null} dataset - null means fetching the default 'mixpanel' dataset
   * @returns {any[] | null} - null means the list isn't initialized and needs to be fetched from api
   */
  _constructTopList(topKey, dataset=null) {
    const topState = this.state[topKey];
    dataset = dataset || this.getDataset();

    if (dataset) {
      return topState[dataset] || null;
    } else {
      const topLists = Object.values(topState);
      const loadingLists = topLists.filter(list => list === BaseQuery.LOADING);
      const loadedItems = [].concat(...topLists.filter(list => list && list !== BaseQuery.LOADING));

      if (loadedItems.length) {
        return loadedItems;
      } else if (loadingLists.length) {
        return BaseQuery.LOADING;
      } else {
        return null;
      }
    }
  }

  _fetchTopList(topKey, dataset, state=null) {
    const query = this.queries[topKey];
    const cache = this.caches[topKey];
    const cacheKey = query.build(state || this.state, {dataset}).query;
    const cachedResult = cache.get(cacheKey);

    if (cachedResult) {
      return Promise.resolve(cachedResult);
    } else {
      return query.run().then(topList => cache.set(cacheKey, topList));
    }
  }

  _updateTopList(topKey, dataset, topValue) {
    this.update({
      [topKey]: extend(this.state[topKey] || {}, {
        [dataset]: topValue,
      }),
    });
  }

  /**
   * Fetch top events and properties for dataset and load into state
   * @returns {Promise} - When all top events and properties have been fetched
   */
  _fetchTopEventsAndProperties(dataset=null) {
    dataset = dataset || this.getDataset();
    const topKeys = [
      TOP_EVENTS,
      TOP.EVENTS.PROPERTIES,
      TOP.PEOPLE.PROPERTIES,
    ];
    const topQueries = topKeys.map(topKey => {
      this._updateTopList(topKey, dataset, BaseQuery.LOADING);
      return this._fetchTopList(topKey, dataset).then(topList => {
        // TODO @evnp: We currently only support custom events in mixpanel dataset; revisit later
        if (topKey === TOP_EVENTS && dataset === DATASET_MIXPANEL) {
          topList = topList.concat(this.customEvents);
        }
        this._updateTopList(topKey, dataset, topList.map(item => extend(item, {dataset})));
      });
    });

    // check whether we need to wait for Top Events query for current dataset before launching the main query
    if (dataset === this.getDataset()) {
      const showClauses = this.getClauseValuesForType(ShowClause.TYPE);
      const isTopEventsQuery = showClauses.map(clause => clause.name).includes(ShowClause.TOP_EVENTS.name);
      if (isTopEventsQuery) {
        topQueries[topKeys.indexOf(TOP_EVENTS)].then(() => this.query());
      } else {
        this.query();
      }
    }

    return Promise.all(topQueries);
  }

  fetchTopPropertiesForEvent(mpEvent, dataset=null) {
    dataset = dataset || this.getDataset();
    const topState = this.state[TOP.EVENTS.PROPERTIES_BY_EVENT][dataset] || {};
    const eventName = util.formatEventName(mpEvent);

    if (!topState[eventName]) {
      this._updateTopList(TOP.EVENTS.PROPERTIES_BY_EVENT, dataset, extend(topState, {
        [eventName]: BaseQuery.LOADING,
      }));
      this._fetchTopList(TOP.EVENTS.PROPERTIES, dataset, {event: eventName}).then(topProperties => {
        this._updateTopList(TOP.EVENTS.PROPERTIES_BY_EVENT, dataset, extend(topState, {
          [eventName]: topProperties.map(item => extend(item, {dataset})),
        }));
      });
    }
  }

  _fetchTopPropertyValues(resourceType, dataset=null) {
    dataset = dataset || this.getDataset();
    const topKey = resourceType === `events` ? TOP.EVENTS.PROPERTY_VALUES : TOP.PEOPLE.PROPERTY_VALUES;

    this._updateTopList(TOP.PROPERTY_VALUES, dataset, BaseQuery.LOADING);
    this._fetchTopList(topKey, dataset).then(topPropertyValues =>
      this._updateTopList(TOP.PROPERTY_VALUES, dataset, topPropertyValues)
    );
  }

  // State modifiers

  updateReport(attrs) {
    // need to get the previous step BEFORE we update the report data
    const prevLearnStep = util.getLearnStep(this.state.report, this.state.learnModalStepIndex);

    const oldUrlData = this.state.report.toUrlData();
    const report = Object.assign(this.state.report, attrs);
    const newUrlData = report.toUrlData();

    const isPeopleAndNotTimeSeries = report.sections.show.isPeopleOnlyQuery() && !report.sections.group.isPeopleTimeSeries();
    if (isPeopleAndNotTimeSeries && report.displayOptions.chartType === `line`) {
      report.displayOptions.chartType = `bar`;
    }
    this.update({report});

    const nextLearnStep = util.getLearnStep(this.state.report, this.state.learnModalStepIndex);
    if (this.state.learnActive && prevLearnStep.name !== nextLearnStep.name) {
      this.transitionLearn();
    } else if (!isEqual(oldUrlData, newUrlData)) {
      history.replaceState(null, null, `#${JSURL.stringify(newUrlData)}`);
      this.update({unsavedChanges: true});
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
      if (numTableHeaders > 2) { // handle special table layout cases for 1 and 2 columns
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
    clauseData.dataset = clauseData.dataset || this.getDataset();

    const stageClauses = this.state.stageClauses.concat();
    let currentClause = stageClauses.pop();
    if (currentClause) {
      stageClauses.push(currentClause.extend(clauseData));
    }
    let newState = {stageClauses};

    this.update(newState);

    // query new property values if we're setting a new filter property
    const activeStageClause = this.activeStageClause;
    if (activeStageClause && activeStageClause.TYPE === `filter` && clauseData.value) {
      this._fetchTopPropertyValues(clauseData.resourceType);
    }

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

  updateShowClauseWidths(idx, attrs={}) {
    let showClauseWidths = this.state.showClauseWidths;
    showClauseWidths[idx] = attrs;
    this.update({showClauseWidths});
  }

  updateGroupClauseWidths(idx, attrs={}) {
    let groupClauseWidths = this.state.groupClauseWidths;
    groupClauseWidths[idx] = attrs;
    this.update({groupClauseWidths});
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
    const chartType = displayOptions.chartType;

    Promise.resolve()
      .then(() => { // bar and table require a different query than line for these math types: min, max, unique, average, median
        const isChangingToLineChart = chartType === `line` && [`bar`, `table`].includes(this.state.report.displayOptions.chartType);
        const isChangingFromLineChart = [`bar`, `table`].includes(chartType) && this.state.report.displayOptions.chartType === `line`;
        return (isChangingToLineChart || isChangingFromLineChart) && this.query({displayOptions, useCache: displayOptions.useCache});
      })
      .then(() => { // stacked bar requires different sorting from other chart types
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
    const dataset = this.getDataset();
    const query = this.queries.segmentation.build(this.state, {dataset}).query;

    this.queries.segmentation.run().then(result=> {
      if (!this.state.result.isEqual(result)) {
        this.update({newCachedData: true});
        this.caches.segmentation.set(query, result, 60);
      } else {
        this.resetToastTimer();
      }
    });

    this.update({toastTimer: null});
  }

  _fetchSmartHubAlerts() {
    const alertContentIds = this.state.report.alertContentIds;
    if (!this.hasWhitelist(`smart-hub`) || !alertContentIds || !alertContentIds.length) {
      return Promise.resolve([]);
    } else {
      return this.queries[SMART_HUB.GET_ALERTS_BY_CONTENT_IDS].build(this.state).run();
    }
  }

  query({useCache=false, displayOptions={}}={}) {
    if (this.canMakeQueries()) {
      const dataset = this.getDataset();
      const reportTrackingData = this.state.report.toTrackingData();
      const query = this.queries.segmentation.build(this.state, {dataset, displayOptions}).query;
      const cachedResult = useCache && this.caches.segmentation.get(query);
      const cacheExpiry = 10; // seconds

      if (!cachedResult) {
        this.update({resultLoading: true});
      }

      this.update({newCachedData: false});
      this.resetToastTimer();
      const queryStartTime = window.performance.now();
      const queryEventProperties = {'cached': !!cachedResult};

      this.trackEvent(`Query Start`, extend(reportTrackingData, queryEventProperties));

      // TODO @evnp 5/16/17: TEMP DEBUG CODE - remove when we switch fully to new Insights API
      const timer = new Date().getTime();

      if (this.compareApis) {
        this.update({
          oldApiResult: new Result({headers: [], series: {}}),
          oldApiQueryTimeMs: null,
          newApiResult: new Result({headers: [], series: {}}),
          newApiQueryTimeMs: null,
        });
        this.queries.oldApiSegmentation.build(this.state, {dataset, displayOptions}).run().then(result => {
          console.info(`Old JQL query result:`);
          console.info(result);
          this.update({
            oldApiResult: result,
            oldApiQueryTimeMs: new Date().getTime() - timer,
            result: this.state.showingOldApiResult ? result : this.state.newApiResult,
          });
        });
      }
      // END DEBUG CODE

      const insightsQuery = this.queries.segmentation.run(cachedResult);
      const fetchSmartHubAlertsQuery = this._fetchSmartHubAlerts();
      Promise.all([insightsQuery, fetchSmartHubAlertsQuery])
        .then(values => {
          const [result, smartHubAlerts] = values;
          if (!cachedResult) {
            this.caches.segmentation.set(query, result, cacheExpiry);
            queryEventProperties[`latency ms`] = Math.round(window.performance.now() - queryStartTime);
          }

          this.update({
            smartHubAlerts,
            result,
            newCachedData: false,
            resultLoading: false,
            report: Object.assign(this.state.report, {
              sorting: this.sortConfigFor(result, this.state.report.sorting),
              legend: this.state.report.legend.updateLegendData(result),
            }),
          });

          // TODO @evnp 5/16/17: TEMP DEBUG CODE - remove when we switch fully to new Insights API
          if (this.compareApis) {
            console.info(`New API query result:`);
            console.info(result);
            this.update({
              newApiResult: result,
              newApiQueryTimeMs: new Date().getTime() - timer,
              result: this.state.showingOldApiResult ? this.state.oldApiResult : result,
            });
          }
          // END DEBUG CODE
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

  // TODO @evnp 5/16/17: TEMP DEBUG CODE - remove when we switch fully to new Insights API
  toggleResult() {
    if (this.compareApis) {
      this.update({
        showingOldApiResult: !this.state.showingOldApiResult,
        result: this.state.showingOldApiResult ? this.state.newApiResult : this.state.oldApiResult,
      });
    }
  }
  // END DEBUG CODE
});
