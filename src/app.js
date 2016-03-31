import { App } from 'panel';
import { mirrorLocationHash } from './mp-common/parent-frame';

import IrbView from './views/irb';
import { extend, replaceAtIndex } from './util';
import {
  BUILDER_SECTION_SHOW,
  BUILDER_SECTION_TIME,
  MATH_TOTAL,
  RESOURCE_EVENTS,
  RESOURCE_VALUE_ALL,
  SCREEN_MAIN,
  TIME_UNIT_HOUR,
} from './constants';

import './stylesheets/app.styl';

const INITIAL_STATE = {
  $screen: SCREEN_MAIN,
  reportName: 'Untitled report',
  showSection: [{
    math: MATH_TOTAL,
    type: RESOURCE_EVENTS,
    value: RESOURCE_VALUE_ALL,
    search: '',
  }],
  timeSection: [{
    unit: TIME_UNIT_HOUR,
    start: -96,
    end: null,
  }],
  groupSection: [],
  filterSection: [],
  editing: {
    section: null,
    index: null,
  },
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
  }

  validateUpdate(stateUpdate) {
    if (
      stateUpdate.editing &&
      stateUpdate.editing.section === BUILDER_SECTION_TIME &&
      stateUpdate.editing.index !== null &&
      stateUpdate.editing.index > 0
    ) {
      throw new Error('Invalid time section edit attempted.');
    }

    if (
      stateUpdate[BUILDER_SECTION_TIME] &&
      stateUpdate[BUILDER_SECTION_TIME].length > 1
    ) {
      throw new Error('Invalid time section update attempted.');
    }
  }

  addSection(section) {
    this.editSection(section);
  }

  editSection(section, index=null) {
    this.update({
      editing: {
        section,
        index,
      }
    });
  }

  updateSection(sectionData) {
    let editing = this.state.editing;
    let section = this.state[editing.section];
    let update = {
      editing: {
        section: null,
        index: null,
      },
    };

    if (editing.index === null) {
      update[editing.section] = section.concat([sectionData]);
    } else {
      sectionData = extend(section[editing.index], sectionData);
      update[editing.section] = replaceAtIndex(section, editing.index, sectionData);
    }

    this.update(update);
  }

  isAddingToSection(section) {
    return this.state.editing.section === section && this.state.editing.index === null;
  }

  isEditingSection(section, index) {
    return this.state.editing.section === section && this.state.editing.index === index;
  }
}
