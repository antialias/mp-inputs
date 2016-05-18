import BaseApp from './base-app.js';
import { extend } from '../util';

import BuilderSections from '../models/builder-sections';
import { ShowSection, TimeSection } from '../models/section';
import { Clause, ShowClause, TimeClause } from '../models/clause';
import TopEventsQuery from '../models/queries/top-events';
import TopPropertiesQuery from '../models/queries/top-properties';
import TopPropertyValuesQuery from '../models/queries/top-property-values';
import SegmentationQuery from '../models/queries/segmentation';
import QueryCache from '../models/queries/query-cache';

import './irb-header';

import template from './index.jade';
import './index.styl';

document.registerElement('irb-app', class IRBApp extends BaseApp {
  get config() {
    return {
      defaultState: {
        reportName: 'Untitled report',
        sections: new BuilderSections({
          show: new ShowSection(new ShowClause({value: ShowClause.TOP_EVENTS})),
          time: new TimeSection(new TimeClause({range: TimeClause.RANGES.HOURS})),
        }),
        stageClause: null,
        topEvents: [],
        topProperties: [],
        topPropertyValues: [],
        result: {
          headers: [],
          data: {},
          loading: true,
        },
        chartType: 'bar',
      },

      template,
    };
  }

  attachedCallback() {
    super.attachedCallback(...arguments);

    this.queries = {
      topEvents: new TopEventsQuery(),
      topProperties: new TopPropertiesQuery(),
      topPropertyValues: new TopPropertyValuesQuery(),
      topPropertyValuesCache: new QueryCache(),
      segmentation: new SegmentationQuery(),
      segmentationCache: new QueryCache(),
    };

    this.queries.topProperties.build(this.state).run().then(topProperties => {
      this.update({topProperties});
    });

    this.queries.topEvents.build(this.state).run().then(topEvents => {
      this.update({topEvents});
      this.query(this.state);
    });
  }

  // State helpers

  isAddingClause(sectionType) {
    return (
      this.state.stageClause &&
      this.state.stageClause.TYPE === sectionType &&
      typeof this.state.stageClauseIndex !== 'number'
    );
  }

  isEditingClause(sectionType, clauseIndex) {
    return (
      this.state.stageClause &&
      this.state.stageClause.TYPE === sectionType &&
      this.state.stageClauseIndex === clauseIndex
    );
  }

  // State modifiers

  startAddingClause(sectionType) {
    this.update({stageClause: Clause.create(sectionType)});
  }

  startEditingClause(sectionType, clauseIndex) {
    const stageClause = this.state.sections[sectionType].clauses[clauseIndex];

    if (stageClause) {
      this.update({
        stageClause,
        stageClauseIndex: clauseIndex,
      });
    } else {
      throw new Error('app.startEditingClause error: invalid clauseIndex provided');
    }
  }

  stopEditingClause() {
    this.stopEditingClauseAttrs();

    const newState = {stageClause: null, stageClauseIndex: null};
    this.update(newState);
  }

  stopEditingClauseAttrs() {
    if (this.state.stageClause) {
      this.updateStageClause({editing: null});
    }
  }

  updateStageClause(clauseData) {
    let newState = {stageClause: this.state.stageClause.extend(clauseData)};

    // query new property values if we're setting a new filter property
    if (this.state.stageClause.TYPE === 'filter' && clauseData.value) {
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
    const sectionType = this.state.stageClause.TYPE;
    const section = this.state.sections[sectionType];
    const clauseIndex = this.state.stageClauseIndex;

    const newClause = this.state.stageClause;
    const newSection = typeof clauseIndex === 'number' ? section.replaceClause(clauseIndex, newClause) : section.addClause(newClause);
    const newState = extend(this.state);

    if (newClause.valid) {
      newState.sections = this.state.sections.replaceSection(sectionType, newSection);

      const cachedQueryResult = this.query(newState);
      if (cachedQueryResult) {
        newState.result = cachedQueryResult;
      } else {
        newState.result = extend(this.state.result, {loading: true});
      }

      this.update(newState);
    }

    this.stopEditingClause();
  }

  removeClause(sectionType, clauseIndex) {
    const section = this.state.sections[sectionType].removeClause(clauseIndex);
    const sections = this.state.sections.replaceSection(sectionType, section);
    const newState = extend(this.state, {sections});

    const cachedQueryResult = this.query(newState);
    if (cachedQueryResult) {
      newState.result = cachedQueryResult;
    } else {
      newState.result = extend(this.state.result, {loading: true});
    }

    this.update(newState);
  }

  query(state) {
    const query = this.queries.segmentation.build(state).query;
    const cachedResult = this.queries.segmentationCache.get(query);
    const cacheExpiry = 10; // seconds

    if (cachedResult) {
      return cachedResult;
    } else {
      this.queries.segmentation.run()
        .then(result => {
          this.queries.segmentationCache.set(query, result, cacheExpiry);
          this.update({result});
        })
        .catch(err => console.error(err));
    }
  }
});
