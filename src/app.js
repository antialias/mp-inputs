import BaseApp from './base-app.js';
import IRBView from './views/irb';
import { extend, replaceAtIndex, removeAtIndex } from './util';
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

import './stylesheets/app.styl';

function createNewClause(section, data) {
  switch(section) {
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
  reportName: 'Untitled report',
  [SECTION_SHOW]: [createNewClause(SECTION_SHOW, {value: RESOURCE_VALUE_TOP_EVENTS})],
  [SECTION_TIME]: [createNewClause(SECTION_TIME)],
  [SECTION_GROUP]: [],
  [SECTION_FILTER]: [],
  topEvents: [],
  topProperties: [],
  topPropertyValues: {},
  query: {},
  result: {},
};

export default class IRBApp extends BaseApp {
  constructor(elID, initialState=INITIAL_STATE, options={}) {
    super(elID, INITIAL_STATE, options);

    window.MP.api.topEvents().done(results =>
      this.update({topEvents: [RESOURCE_VALUE_TOP_EVENTS, ...Object.values(results.values())]}));

    window.MP.api.topProperties().done(results => {
      let props = results.values();
      this.update({topProperties: Object.keys(props).sort((a, b) => props[b] - props[a])});
    });

    this.query();
  }

  get SCREENS() {
    return {
      [SCREEN_MAIN]: new IRBView(),
    };
  }

  main(state={}) {
    this.update({$screen: SCREEN_MAIN});
  }

  update() {
    super.update(...arguments);
    this.query();
    this.queryPropertyValues();
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

    if ( // clear filter value if filter type is set or not set
      clauseData.filterType === FILTER_SET ||
      clauseData.filterType === FILTER_NOT_SET
    ) {
      newClause.filterValue = null;
    }

    if (this.isClauseValid(newClause)) {
      let newSection;

      if (clause) {
        newSection = replaceAtIndex(section, index, newClause);

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
        newState[sectionType] = newSection;
      }
    }

    this.update(newState);
  }

  updatePaneIndex(sectionType, paneIndex) {
    this.updateSection(sectionType, this.state[sectionType].indexOf(this.state.editing), {paneIndex});
  }

  removeClause(sectionType, index) {
    this.update({
      [sectionType]: removeAtIndex(this.state[sectionType], index),
    });
  }

  query() {
    const time = this.state[SECTION_TIME][0];
    const query = {
      events: this.state[SECTION_SHOW].map(clause => clause.value),
      segments: this.state[SECTION_GROUP].map(clause => clause.value),
      filters: this.state[SECTION_FILTER].map(clause => [clause.value, clause.filterType, clause.filterValue]),
      unit: time.unit,
      from: time.range.from,
      to: time.range.to,
    };

    if (query.events.indexOf(RESOURCE_VALUE_TOP_EVENTS) !== -1) {
      query.events = removeAtIndex(this.state.topEvents, this.state.topEvents.indexOf(RESOURCE_VALUE_TOP_EVENTS));
    }

    const matchesState = key =>
      JSON.stringify(query[key]) === JSON.stringify(this.state.query[key]);

    if (!Object.keys(query).every(matchesState)) {
      this.update({query});

      const { events, segments, filters, unit, from, to } = query;

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

        if (filters.length) {
          function format() {
            return `(${Array.prototype.slice.call(arguments).join(' ')})`;
          }

          params.where = filters.map(filter => {
            let [ property, type, value ] = filter;
            const isValid = !!(property && (value || type === FILTER_SET || type === FILTER_NOT_SET));

            if (!isValid) {
              return null;
            }

            property = `(properties["${property}"])`;
            value = `"${value}"`;

            switch (type) {
              case FILTER_EQUALS       : return format(property, '==', value);
              case FILTER_NOT_EQUALS   : return format(property, '!=', value);
              case FILTER_CONTAINS     : return format(value, 'in', property);
              case FILTER_NOT_CONTAINS : return format('not', value, 'in', property);
              case FILTER_SET          : return format('defined', property);
              case FILTER_NOT_SET      : return format('not defined', property);
            }
          }).filter(filter => filter).join(' and ');
        }

        window.MP.api.query(`api/2.0/${endpoint}`, params)
          .done(results => this.update({result: results.data.values}));
      }
    }

    return query;
  }

  queryPropertyValues() {
    if (this.state.editing && this.state.editing.section === SECTION_FILTER) {
      const name = this.state.editing.value;

      if (name && !this.state.topPropertyValues[name]) {
        window.MP.api.query('api/2.0/events/properties/values', {name}).done(results => this.update({
          topPropertyValues: extend(this.state.topPropertyValues, {[name]: results.sort()}),
        }));
      }
    }
  }
}
