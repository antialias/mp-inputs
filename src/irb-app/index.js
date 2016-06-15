import MPApp from 'mixpanel-common/build/report/mp-app';
import { extend, pick } from 'mixpanel-common/build/util';
import * as util from '../util';

import BuilderSections from '../models/builder-sections';
import { ShowSection, TimeSection } from '../models/section';
import { Clause, ShowClause, TimeClause } from '../models/clause';
import TopEventsQuery from '../models/queries/top-events';
import TopPropertiesQuery from '../models/queries/top-properties';
import TopPropertyValuesQuery from '../models/queries/top-property-values';
import SegmentationQuery from '../models/queries/segmentation';
import QueryCache from '../models/queries/query-cache';

import './irb-header';
import './irb-builder';
import './irb-result';

import template from './index.jade';
import './index.styl';

document.registerElement('irb-app', class IRBApp extends MPApp {
  get config() {
    return {
      defaultState: extend(
        this.resettableState,
        {
          // The following states should persist through reset.
          util,
        }
      ),

      template,
    };
  }

  // The following states should be reset.
  get resettableState() {
    return {
      reportName: 'Untitled report',
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
      stageClauses: [],
      topEvents: [],
      topProperties: [],
      topPropertyValues: [],
      result: {
        headers: [],
        series: {},
        loading: true,
      },
      chartType: 'bar',
    };
  }

  attachedCallback() {
    super.attachedCallback(...arguments);

    this.customEvents = (this.parentData && this.parentData.custom_events) || [];
    this.queries = {
      topEvents: new TopEventsQuery(),
      topProperties: new TopPropertiesQuery(),
      topPropertyValues: new TopPropertyValuesQuery(),
      topPropertyValuesCache: new QueryCache(),
      segmentation: new SegmentationQuery(this.customEvents),
      segmentationCache: new QueryCache(),
    };
    this.resetTopQueries();
  }

  resetTopQueries() {
    this.queries.topProperties.build(this.state).run().then(topProperties => {
      this.update({topProperties});
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

  get persistenceKey() {
    return 'irb2';
  }

  toSerializationAttrs() {
    return extend({
      sections: this.state.sections.serialize(),
    }, pick(this.state, [
      'chartType',
      'reportName',
      'series',
    ]));
  }

  fromSerializationAttrs(attrs) {
    return extend(attrs, {sections: BuilderSections.deserialize(attrs.sections)});
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

  resetQuery() {
    this.update(this.resettableState);
    this.resetTopQueries();
  }

  startAddingClause(sectionType) {
    this.update({stageClauses: this.state.stageClauses.concat(Clause.create(sectionType))});
  }

  startEditingClause(sectionType, clauseIndex) {
    const stageClauses = this.state.stageClauses.concat(this.state.sections[sectionType].clauses[clauseIndex]);

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
      const query = this.queries.topPropertyValues.build(newState).query;
      const cachedResult = this.queries.topPropertyValuesCache.get(query);

      if (cachedResult) {
        newState.topPropertyValues = cachedResult;
      } else {
        this.queries.topPropertyValues.run().then(topPropertyValues => {
          this.queries.topPropertyValuesCache.set(query, topPropertyValues);
          this.update({topPropertyValues});
        });
      }
    }

    this.update(newState);
  }

  commitStageClause() {
    const newClauses = this.state.stageClauses;
    let newState = extend(this.state);

    if (newClauses.length) {
      newClauses.filter(clause => clause.valid).forEach(clause => {
        const newClause = clause.extend({paneIndex: 0});
        let newSection = null;
        if (clause === newClauses[0] && typeof newState.stageClauseIndex === 'number') {
          newSection = newState.sections[newClause.TYPE].replaceClause(newState.stageClauseIndex, newClause);
        } else {
          newSection = newState.sections[newClause.TYPE].addClause(newClause);
        }
        newState.sections = newState.sections.replaceSection(clause.TYPE, newSection);
      });

      newState = this.query(newState);
      this.update(newState);
    }

    this.stopEditingClause();
  }

  removeClause(sectionType, clauseIndex) {
    const section = this.state.sections[sectionType].removeClause(clauseIndex);
    const sections = this.state.sections.replaceSection(sectionType, section);
    let newState = extend(this.state, {sections});

    newState = this.query(newState);
    this.update(newState);
  }

  updateSeriesState(newState) {
    this.update({series: extend(this.state.series, newState)});
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

  query(state=this.state, useCache=true) {
    const query = this.queries.segmentation.build(state).query;
    const cachedResult = useCache && this.queries.segmentationCache.get(query);
    const cacheExpiry = 10; // seconds

    if (!cachedResult) {
      let result = extend(state.result, {loading: true});
      this.update({result});
    }

    this.queries.segmentation.run(cachedResult)
      .then(result => {
        if (!cachedResult) {
          this.queries.segmentationCache.set(query, result, cacheExpiry);
        }
        this.updateSeriesData(result);
        this.update({result});
      })
      .catch(err => console.error(err));

    return state;
  }
});
