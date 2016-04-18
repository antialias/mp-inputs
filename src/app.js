import BaseApp from './base-app.js';
import IRBView from './views/irb';
import { extend, replaceIndex, removeIndex } from './util';
import {
  FILTER_CONTAINS,
  FILTER_EQUALS,
  FILTER_NOT_CONTAINS,
  FILTER_NOT_EQUALS,
  FILTER_NOT_SET,
  FILTER_SET,
  MATH_TOTAL,
  RESOURCE_EVENTS,
  RESOURCE_VALUE_TOP_EVENTS,
  SCREEN_MAIN,
  SECTION_FILTER,
  SECTION_GROUP,
  SECTION_SHOW,
  SECTION_TIME,
  TIME_UNIT_HOUR,
} from './constants';
import TopEventsQuery from './queries/top-events';
import TopPropertiesQuery from './queries/top-properties';
import TopPropertyValuesQuery from './queries/top-property-values';
import SegmentationQuery from './queries/segmentation';

import './stylesheets/app.styl';

function createNewClause(sectionType, data) {
  switch(sectionType) {
    case SECTION_SHOW:
      return extend({
        section: SECTION_SHOW,
        math: MATH_TOTAL,
        type: RESOURCE_EVENTS,
        value: null,
        search: '',
      }, data);
    case SECTION_TIME:
      let to = new Date();
      let from = new Date();

      from.setHours(to.getHours() - 96);

      return extend({
        section: SECTION_TIME,
        unit: TIME_UNIT_HOUR,
        range: {
          from,
          to,
        },
      }, data);
    case SECTION_GROUP:
      return extend({
        section: SECTION_GROUP,
        type: RESOURCE_EVENTS,
        value: null,
        search: '',
      }, data);
    case SECTION_FILTER:
      return extend({
        section: SECTION_FILTER,
        type: RESOURCE_EVENTS,
        value: null,
        filterType: FILTER_EQUALS,
        filterValue: null,
        paneIndex: 0,
        search: '',
      }, data);
  }
}

function validateClause(clause) {
  switch (clause.section) {
    case SECTION_SHOW:
      if (!clause.value) {
        throw new Error('invalid show clause: no value present');
      }
      break;
    case SECTION_TIME:
      if (!clause.unit) {
        throw new Error('invalid time clause: no unit present');
      } else if (!(
        clause.range &&
        clause.range.from instanceof Date &&
        clause.range.to instanceof Date
      )) {
        throw new Error('invalid time clause: range does not contain both a to and from Date');
      }
      break;
    case SECTION_GROUP:
      if (!clause.value) {
        throw new Error('invalid group clause: no value present');
      }
      break;
    case SECTION_FILTER:
      if (!(clause.value)) {
        throw new Error('invalid filter clause: no property present');
      }
      break;
  }
}

function validateSection(section) {
  if (section.length > 1 && section[0].section === SECTION_TIME) {
    throw new Error('invalid time section: number of clauses cannot exceed 1');
  }
}

const INITIAL_STATE = {
  $screen: SCREEN_MAIN,
  name: 'Untitled report',
  sections: {
    show: [createNewClause(SECTION_SHOW, {value: RESOURCE_VALUE_TOP_EVENTS})],
    group: [],
    time: [createNewClause(SECTION_TIME)],
    filter: [],
  },
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
      [SCREEN_MAIN]: new IRBView(),
    };
  }

  main(state={}) {
    this.update({$screen: SCREEN_MAIN});
  }

  // State helpers

  clauseAt(sectionType, clauseIndex) {
    return this.state.sections[sectionType][clauseIndex];
  }

  isAddingClause(sectionType) {
    return this.isEditingClause(sectionType, -1);
  }

  isEditingClause(sectionType, clauseIndex) {
    return (
      this.state.editing &&
      this.state.editing.section === sectionType &&
      this.state.sections[sectionType].indexOf(this.state.editing) === clauseIndex
    );
  }

  isClauseValid(clause) {
    try {
      validateClause(clause);
      return true;
    } catch (error) {
      return false;
    }
  }

  isSectionValid(section) {
    try {
      validateSection(section);
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  // State modifiers

  startAddingClause(sectionType) {
    this.update({editing: createNewClause(sectionType)});
  }

  startEditingClause(sectionType, index) {
    this.update({editing: this.clauseAt(sectionType, index)});
  }

  stopEditingClause() {
    this.update({editing: null});
  }

  updatePaneIndex(sectionType, paneIndex) {
    let clauseIndex = this.state.sections[sectionType].indexOf(this.state.editing);
    this.updateClause(sectionType, clauseIndex, {paneIndex});
  }

  updateClause(sectionType, clauseIndex, clauseData) {
    console.log('updating section', clauseData)
    let section = this.state.sections[sectionType];
    let clause = section[clauseIndex];
    let newClause = extend(clause || this.state.editing || {}, clauseData);
    let newState = {editing: newClause};

    if (this.isClauseValid(newClause)) {
      let newSection;

      if (clause) {
        newSection = replaceIndex(section, clauseIndex, newClause);

        if ( // don't keep the pane open if we're completing a filter clause
          newClause.section === SECTION_FILTER &&
          clauseData.filterType === FILTER_SET ||
          clauseData.filterType === FILTER_NOT_SET ||
          (newClause.value && !clause.filterValue && clauseData.filterValue)
        ) {
          newState.editing = null;
        }
      } else {
        newSection = [...section, newClause];

        // don't keep the pane open if we're adding a new non-filter clause
        if (newClause.section !== SECTION_FILTER) {
          newState.editing = null;
        }
      }

      if (this.isSectionValid(newSection)) {
        newState.sections = extend(this.state.sections, {[sectionType]: newSection});
      }
    }

    this.update(newState);
    this.queries.segmentation.run(this.state)
      .then(result => this.update({result}));

    // query new property values if we're setting a new filter property
    if (sectionType === SECTION_FILTER && clauseData.value) {
      this.queries.topPropertyValues.run(this.state)
        .then(topPropertyValues => this.update({topPropertyValues}));
    }
  }

  removeClause(sectionType, clauseIndex) {
    this.update({
      sections: extend(this.state.sections, {
        [sectionType]: removeIndex(this.state.sections[sectionType], clauseIndex)
      }),
    });

    this.queries.segmentation.run(this.state)
      .then(result => this.update({result}));
  }
}
