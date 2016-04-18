import BaseApp from './base-app.js';
import IRBView from './views/irb';
import { extend, replaceIndex, removeIndex } from './util';

import Sections from './models/sections';
import { ShowSection, TimeSection } from './models/section';
import { Clause, ShowClause, TimeClause } from './models/clause';

import TopEventsQuery from './models/queries/top-events';
import TopPropertiesQuery from './models/queries/top-properties';
import TopPropertyValuesQuery from './models/queries/top-property-values';
import SegmentationQuery from './models/queries/segmentation';

import './stylesheets/app.styl';

const INITIAL_STATE = {
  $screen: 'main',
  reportName: 'Untitled report',
  sections: new Sections({
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
      segmentation: new SegmentationQuery(),
    };

    this.queries.topProperties.run(this.state)
      .then(topProperties => this.update({topProperties}));

    this.queries.topEvents.run(this.state)
      .then(topEvents => {
        this.update({topEvents});
        this.queries.segmentation.run(this.state)
          .then(result => this.update({result}));
      });
  }

  get SCREENS() {
    return {
      main: new IRBView(),
    };
  }

  main(state={}) {
    this.update({$screen: 'main'});
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
    let { section, clause } = this.state.sections.get(sectionType, clauseIndex);
    this.update({editingClause: clause});
  }

  stopEditingClause() {
    this.update({editingClause: null});
  }

  updateClause(sectionType, clauseIndex, clauseData) {
    let { section, clause } = this.state.sections.get(sectionType, clauseIndex);
    let editingExistingClause = !!clause;

    let oldClause = clause || this.state.editingClause;
    let newClause = Clause.create(sectionType, extend(oldClause ? oldClause.attrs : {}, clauseData));
    let newSection = editingExistingClause ? section.replaceClause(clauseIndex, newClause) : section.addClause(newClause);
    let newState = {editingClause: newClause};

    if (newClause.valid) {
      newState.sections = this.state.sections.replaceSection(sectionType, newSection);

      if ( // don't keep the pane open if we're completing a filter clause
        editingExistingClause &&
        sectionType === 'filter' &&
        newClause.filterTypeIsSetOrNotSet ||
        (newClause.value && !oldClause.filterValue && newClause.filterValue)
      ) {
        newState.editingClause = null;
      }

      if ( // don't keep the pane open if we're adding a new non-filter clause
        !editingExistingClause &&
        sectionType !== 'filter'
      ) {
        newState.editingClause = null;
      }
    }

    this.update(newState);
    this.queries.segmentation.run(this.state)
      .then(result => this.update({result}));

    // query new property values if we're setting a new filter property
    if (sectionType === 'filter' && clauseData.value) {
      this.queries.topPropertyValues.run(this.state)
        .then(topPropertyValues => this.update({topPropertyValues}));
    }
  }

  removeClause(sectionType, clauseIndex) {
    let section = this.state.sections[sectionType].removeClause(clauseIndex);
    let sections = this.state.sections.replaceSection(sectionType, section);
    this.update({sections});

    this.queries.segmentation.run(this.state)
      .then(result => this.update({result}));
  }
}
