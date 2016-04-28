import BaseApp from './base-app.js';
import IRBView from './views/irb';
import { extend, replaceIndex, removeIndex } from './util';

import BuilderSections from './models/builder-sections';
import { ShowSection, TimeSection } from './models/section';
import { Clause, ShowClause, TimeClause } from './models/clause';

import TopEventsQuery from './models/queries/top-events';
import TopPropertiesQuery from './models/queries/top-properties';
import TopPropertyValuesQuery from './models/queries/top-property-values';
import SegmentationQuery from './models/queries/segmentation';
import QueryCache from './models/queries/query-cache';

import './stylesheets/app.styl';

const INITIAL_STATE = {
  $screen: 'main',
  reportName: 'Untitled report',
  sections: new BuilderSections({
    show: new ShowSection(new ShowClause({value: ShowClause.TOP_EVENTS})),
    time: new TimeSection(new TimeClause()),
  }),
  editingClause: null,
  topEvents: [],
  topProperties: [],
  topPropertyValues: [],
  result: {},
};

export default class IRBApp extends BaseApp {
  constructor(elID, initialState=INITIAL_STATE, options={}) {
    super(elID, INITIAL_STATE, options);

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

  get SCREENS() {
    return {
      main: new IRBView(),
    };
  }

  // State helpers

  get editingClauseIndex() {
    if (this.state.editingClause) {
      return this.state.sections[this.state.editingClause.TYPE].clauses.indexOf(this.state.editingClause);
    } else {
      return -1;
    }
  }

  isAddingClause(sectionType) {
    return this.isEditingClause(sectionType, -1);
  }

  isEditingClause(sectionType, clauseIndex) {
    return (
      this.state.editingClause &&
      this.state.editingClause.TYPE === sectionType &&
      this.editingClauseIndex === clauseIndex
    );
  }

  // State modifiers

  startAddingClause(sectionType) {
    this.update({editingClause: Clause.create(sectionType)});
  }

  startEditingClause(sectionType, clauseIndex) {
    const section = this.state.sections[sectionType];
    const clause = section.clauses[clauseIndex];

    this.update({editingClause: clause});
  }

  stopEditingClause() {
    this.stopEditingClauseAttrs();

    const newState = {editingClause: null};
    const cachedQueryResult = this.query(this.state);

    if (cachedQueryResult) {
      newState.result = cachedQueryResult;
    }

    this.update(newState);
  }

  stopEditingClauseAttrs() {
    if (this.state.editingClause) {
      this.updateEditingClause({editing: null});
    }
  }

  updateEditingClause(clauseData) {
    const sectionType = this.state.editingClause.TYPE;
    const clauseIndex = this.state.sections[sectionType].clauses.indexOf(this.state.editingClause);

    if (clauseIndex >= 0) {
      this.updateClause(sectionType, clauseIndex, clauseData);
    } else {
      this.update({editingClause: Clause.create(sectionType, extend(this.state.editingClause.attrs, clauseData))});
    }
  }

  updateClause(sectionType, clauseIndex, clauseData, closePane) {
    const section = this.state.sections[sectionType];
    const clause = section.clauses[clauseIndex];
    const editingExistingClause = !!clause;

    const oldClause = clause || this.state.editingClause;
    const newClause = Clause.create(sectionType, extend(oldClause ? oldClause.attrs : {}, clauseData));
    const newSection = editingExistingClause ? section.replaceClause(clauseIndex, newClause) : section.addClause(newClause);
    const newState = extend(this.state, {editingClause: newClause});

    // query new property values if we're setting a new filter property
    if (sectionType === 'filter' && clauseData.value) {
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

    if (newClause.valid) {
      newState.sections = this.state.sections.replaceSection(sectionType, newSection);
    }

    if (closePane) {
      newState.editingClause = null;
    }

    this.update(newState);
  }

  removeClause(sectionType, clauseIndex) {
    const section = this.state.sections[sectionType].removeClause(clauseIndex);
    const sections = this.state.sections.replaceSection(sectionType, section);
    const newState = extend(this.state, {sections});

    const cachedQueryResult = this.query(newState);
    if (cachedQueryResult) {
      newState.result = cachedQueryResult;
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
      this.queries.segmentation.run().then(result => {
        this.queries.segmentationCache.set(query, result, cacheExpiry);
        this.update({result});
      });
    }
  }
}
