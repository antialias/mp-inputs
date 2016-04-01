import { App } from 'panel';
import { mirrorLocationHash } from './mp-common/parent-frame';

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

function getNewSectionClause(sectionType) {
  return {
    [SECTION_SHOW]: {
      section: SECTION_SHOW,
      math: MATH_TOTAL,
      type: RESOURCE_EVENTS,
      value: RESOURCE_VALUE_ALL,
      search: '',
    },
    [SECTION_TIME]: {
      section: SECTION_TIME,
      unit: TIME_UNIT_HOUR,
      start: -96,
      end: null,
    },
    [SECTION_GROUP]: {
      section: SECTION_GROUP,
      type: RESOURCE_EVENTS,
      value: null,
      search: '',
    }
  }[sectionType];
};

const INITIAL_STATE = {
  $screen: SCREEN_MAIN,
  reportName: 'Untitled report',
  [SECTION_SHOW]: [getNewSectionClause(SECTION_SHOW)],
  [SECTION_TIME]: [getNewSectionClause(SECTION_TIME)],
  [SECTION_GROUP]: [],
  [SECTION_FILTER]: [],

};

export default class IrbApp extends App {
  constructor(elID, initialState=INITIAL_STATE, attrs={}) {
    super(elID, INITIAL_STATE, attrs);

    // initialize frame communication
    if (attrs.parentFrame) {
      this.parentFrame = attrs.parentFrame;
      mirrorLocationHash(this.parentFrame);
    }
  }

  get SCREENS() {
    return {
      [SCREEN_MAIN]: new IrbView(),
    };
  }

  main(state={}) {
    this.update({$screen: SCREEN_MAIN});
  }

  update(stateUpdate={}) {
    this.validateUpdate(stateUpdate);
    super.update(...arguments);
    console.log(this.state);
  }

  validateUpdate(stateUpdate) {
    if (
      stateUpdate.editing &&
      stateUpdate.editing.section === SECTION_TIME &&
      stateUpdate.editing.index !== null &&
      stateUpdate.editing.index > 0
    ) {
      throw new Error('Invalid time section edit attempted.');
    }

    if (
      stateUpdate[SECTION_TIME] &&
      stateUpdate[SECTION_TIME].length > 1
    ) {
      throw new Error('Invalid time section update attempted.');
    }
  }

  // State helpers

  sectionClauseAt(sectionType, index) {
    return this.state[sectionType][index];
  }

  isAddingSectionClause(sectionType) {
    return this.isEditingSectionClause(sectionType, -1);
  }

  isEditingSectionClause(sectionType, index) {
    return (
      this.state.editing &&
      this.state.editing.section === sectionType &&
      this.state[sectionType].indexOf(this.state.editing) === index
    );
  }

  isSectionClauseValid(sectionClauseData) {
    switch(sectionClauseData.section) {
      case SECTION_SHOW:
        return true;
      case SECTION_GROUP:
        return !!sectionClauseData.value;
      case SECTION_TIME:
        return true;
      case SECTION_FILTER:
        return true;
    }
  }

  // State modifiers

  startAddingSectionClause(sectionType) {
    this.update({editing: getNewSectionClause(sectionType)});
  }

  startEditingSectionClause(sectionType, index) {
    this.update({editing: this.state[sectionType][index]});
  }

  updateSection(sectionClauseData) {
    let editing = this.state.editing;
    let section = this.state[editing.section];
    let editingIndex = section.indexOf(editing);

    let newSectionClause = extend(editing, sectionClauseData);
    let newState = {editing: newSectionClause};

    if (this.isSectionClauseValid(editing)) {
      if (editingIndex === -1) {
        newState[editing.section] = section.concat([newSectionClause]);
      } else {
        newState[editing.section] = replaceAtIndex(section, editingIndex, newSectionClause);
      }
    }

    this.update(newState);
  }
}
