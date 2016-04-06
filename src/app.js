import BaseApp from './base-app.js';
import IrbView from './views/irb';
import { extend, replaceAtIndex, removeAtIndex } from './util';
import {
  SECTION_SHOW,
  SECTION_TIME,
  SECTION_GROUP,
  SECTION_FILTER,
  MATH_TOTAL,
  RESOURCE_EVENTS,
  RESOURCE_VALUE_TOP_EVENTS,
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
      value: RESOURCE_VALUE_TOP_EVENTS,
      search: '',
    };
    case SECTION_TIME:
      let to = new Date();
      let from = new Date();

      from.setHours(to.getHours() - 96);

      return {
        section: SECTION_TIME,
        unit: TIME_UNIT_HOUR,
        range: {
          from,
          to,
        },
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
    throw new Error('invalid group clause: no value present');
  } else if (clause.section === SECTION_TIME) {
    if (!clause.unit) {
      throw new Error('invalid time clause: no unit present');
    } else if (!(
      clause.range &&
      clause.range.from instanceof Date &&
      clause.range.to instanceof Date
    )) {
      throw new Error('invalid time clause: range does not contain both a to and from Date');
    }
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
  query: {},
  result: {},
};

export default class IrbApp extends BaseApp {
  constructor(elID, initialState=INITIAL_STATE, attrs={}) {
    super(elID, INITIAL_STATE, attrs);

    window.MP.api.topEvents().done(results =>
      this.update({events: [RESOURCE_VALUE_TOP_EVENTS].concat(Object.values(results.values()))})
    );

    window.MP.api.topProperties().done(results => {
      let props = results.values();
      this.update({properties: Object.keys(props).sort((a, b) => props[b] - props[a])})
    });

    this.query();
  }

  get SCREENS() {
    return {
      [SCREEN_MAIN]: new IrbView(),
    };
  }

  main(state={}) {
    this.update({$screen: SCREEN_MAIN});
  }

  update() {
    super.update(...arguments);
    this.query();
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
    this.update({editing: null});
  }

  updateSection(sectionType, index, clauseData) {
    let section = this.state[sectionType];
    let clause = section[index];
    let newClause = extend(clause || this.state.editing || {}, clauseData);
    let newState = {editing: newClause};

    if (this.isClauseValid(newClause)) {
      let newSection;

      if (clause) {
        newSection = replaceAtIndex(section, index, newClause);
      } else {
        newSection = section.concat([newClause]);
      }

      if (this.isSectionValid(newSection)) {
        newState[sectionType] = newSection;
      }
    }

    this.update(newState);
  }

  query() {
    const time = this.state[SECTION_TIME][0];
    const query = {
      events: this.state[SECTION_SHOW].map(clause => clause.value),
      segments: this.state[SECTION_GROUP].map(clause => clause.value),
      unit: time.unit,
      from: time.range.from,
      to: time.range.to,
    };

    if (query.events.indexOf(RESOURCE_VALUE_TOP_EVENTS) !== -1) {
      query.events = removeAtIndex(this.state.events, this.state.events.indexOf(RESOURCE_VALUE_TOP_EVENTS));
    }

    if (Object.keys(query).some(key => JSON.stringify(query[key]) !== JSON.stringify(this.state.query[key]))) {
      this.update({query});

      let { events, segments, unit, from, to } = query;

      if (events.length) {
        let endpoint = 'events';
        let params = {unit, from, to, event: events};

        if (events.length === 1 && segments.length) {
          params.event = events[0];

          if (segments.length === 1) {
            endpoint = 'segmentation';
            params.on = `properties["${segments[0]}"]`;
          } else {
            endpoint = 'segmentation/multiseg';
            params.outer = `properties["${segments[0]}"]`;
            params.inner = `properties["${segments[1]}"]`;
          }
        }

        window.MP.api.query(`api/2.0/${endpoint}`, params)
          .done(results => this.update({result: results.data.values}));
      }
    }

    return query;
  }
}
