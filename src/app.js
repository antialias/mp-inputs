import _ from 'lodash';

import BaseApp from './base-app.js';
import IrbView from './views/irb';
import { extend, replaceAtIndex } from './util';
import {
  SECTION_SHOW,
  SECTION_TIME,
  SECTION_GROUP,
  SECTION_FILTER,
  MATH_TOTAL,
  RESOURCE_EVENTS,
  RESOURCE_VALUE_ALL,
  SCREEN_MAIN,
  TIME_UNIT_HOUR,
} from './constants';

import './stylesheets/app.styl';

function createNewClause(section) {
  switch(section) {
    case SECTION_SHOW: return {
      section: SECTION_SHOW,
      math: MATH_TOTAL,
      type: RESOURCE_EVENTS,
      value: RESOURCE_VALUE_ALL,
      search: '',
    };
    case SECTION_TIME: return {
      section: SECTION_TIME,
      unit: TIME_UNIT_HOUR,
      start: -96,
      end: null,
    };
    case SECTION_GROUP: return {
      section: SECTION_GROUP,
      type: RESOURCE_EVENTS,
      value: null,
      search: '',
    };
  }
}

function validateClause(clause) {
  if (clause.section === SECTION_GROUP && !clause.value) {
    throw new Error('invalid group clause: no value present')
  }
}

function validateSection(section) {
  if (section.length > 1 && section[0].section === SECTION_TIME) {
    throw new Error('invalid time section: number of clauses cannot exceed 1');
  }
}


const INITIAL_STATE = {
  $screen: SCREEN_MAIN,
  reportName: 'Untitled report',
  [SECTION_SHOW]: [createNewClause(SECTION_SHOW)],
  [SECTION_TIME]: [createNewClause(SECTION_TIME)],
  [SECTION_GROUP]: [],
  [SECTION_FILTER]: [],
  events: [],
  properties: [],
};

export default class IrbApp extends BaseApp {
  constructor(elID, initialState=INITIAL_STATE, attrs={}) {
    super(elID, INITIAL_STATE, attrs);

    window.MP.api.topEvents().done(results =>
      this.update({events: Object.values(results.values())})
    );

    window.MP.api.topProperties().done(results =>
      this.update({
        properties:
          _(results.values())
            .toPairs()
            .sortBy(pair => -pair[1])
            .map(pair => pair[0])
            .value()
      })
    );
  }

  get SCREENS() {
    return {
      [SCREEN_MAIN]: new IrbView(),
    };
  }

  main(state={}) {
    this.update({$screen: SCREEN_MAIN});
  }

  // State helpers

  clauseAt(sectionType, index) {
    return this.state[sectionType][index];
  }

  isAddingClause(sectionType) {
    return this.isEditingClause(sectionType, -1);
  }

  isEditingClause(sectionType, index) {
    return (
      this.state.editing &&
      this.state.editing.section === sectionType &&
      this.state[sectionType].indexOf(this.state.editing) === index
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
    console.log('stopping edit')
    this.update({editing: null});
  }

  updateSection(clauseData) {
    let editing = this.state.editing;
    let sectionType = editing.section;
    let section = this.state[sectionType];
    let editingIndex = section.indexOf(editing);
    let addingIncompleteClause = this.isAddingClause(sectionType) && !_.has(clauseData, 'value');

    let newClause = extend(editing, clauseData);
    let newState = {editing: newClause};

    if (!addingIncompleteClause) {
      if (this.isClauseValid(newClause)) {
        let newSection;

        if (editingIndex === -1) {
          newSection = section.concat([newClause]);
        } else {
          newSection = replaceAtIndex(section, editingIndex, newClause);
        }

        if (this.isSectionValid(newSection)) {
          newState[sectionType] = newSection;
        }
      }
    }

    this.update(newState);
  }
}
