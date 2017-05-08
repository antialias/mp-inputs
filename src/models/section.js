import {
  insertAtIndex,
  replaceByIndex,
  removeByIndex,
} from 'mixpanel-common/util';
import { debug } from 'mixpanel-common/report/util';

import {
  Clause,
  ShowClause,
  GroupClause,
  FilterClause,
  TimeClause,
} from './clause';
import { extend } from '../util';

export class Section {
  constructor(attrs={}) {
    const clauseArgs = Array.prototype.slice.call(arguments)
      .filter(arg => arg instanceof Clause);
    this.clauses = [...clauseArgs, ...(attrs.clauses || [])];
  }

  get attrs() {
    const { clauses } = this;
    return {clauses};
  }

  get valid() {
    return this.clauses.every(clause => clause.valid);
  }

  static create(sectionType, attrs) {
    switch (sectionType) {
      case `show`: return new ShowSection(attrs);
      case `group`: return new GroupSection(attrs);
      case `filter`: return new FilterSection(attrs);
      case `time`: return new TimeSection(attrs);
    }
  }

  static deserialize(sectionType, clauseAttrs, customEventsIdMap={}) {
    let clauses;

    if (Array.isArray(clauseAttrs)) {
      clauses = clauseAttrs;
    } else if (typeof clauseAttrs === `object` && Array.isArray(clauseAttrs.clauses)) {
      clauses = clauseAttrs.clauses;
    }

    if (clauses) {
      return Section.create(sectionType, extend(clauseAttrs, {
        // pass down custom events data so clauses can get the latest version of each custom event
        clauses: clauses.map(clause => Clause.create(sectionType, clause, customEventsIdMap)),
      }));
    } else {
      return {clauses: []};
    }
  }

  create() {
    return Section.create(...arguments);
  }

  serialize() {
    return this.clauses.map(c => c.serialize());
  }

  toUrlData() {
    return this.clauses.map(c => c.toUrlData());
  }

  validate(newSection) {
    const valid = newSection.valid;

    if (!valid) {
      debug.warn(`${this.TYPE} section invalid:`, newSection);
    }

    return valid ? newSection : this;
  }

  hasClauses() {
    return !!this.clauses.length;
  }

  appendClause(newClause) {
    return this.validate(Section.create(this.TYPE, extend(this, {clauses: insertAtIndex(this.clauses, this.clauses.length, newClause)})));
  }

  getLastClause() {
    return this.hasClauses() ? this.clauses[this.clauses.length - 1] : null;
  }

  insertClause(index, newClause) {
    return this.validate(Section.create(this.TYPE, extend(this, {clauses: insertAtIndex(this.clauses, index, newClause)})));
  }

  replaceClause(index, newClause) {
    return this.validate(Section.create(this.TYPE, extend(this, {clauses: replaceByIndex(this.clauses, index, newClause)})));
  }

  removeClause(index) {
    return this.validate(Section.create(this.TYPE, extend(this, {clauses: removeByIndex(this.clauses, index)})));
  }

  removeAllClauses() {
    return this.validate(Section.create(this.TYPE, extend(this, {clauses: []})));
  }
}

export class ShowSection extends Section {
  get valid() {
    return super.valid &&
      this.clauses.every(clause => clause instanceof ShowClause);
  }

  clauseResourceTypes() {
    let uniqueShowTypes = this.clauses.reduce(
      (types, clause) => types.add(
        clause.resourceType === Clause.RESOURCE_TYPE_ALL ? Clause.RESOURCE_TYPE_EVENTS : clause.resourceType
      ),
      new Set()
    );
    uniqueShowTypes = Array.from(uniqueShowTypes);
    return uniqueShowTypes.length === 1 ? uniqueShowTypes[0] : uniqueShowTypes;
  }

  isPeopleOnlyQuery() {
    return this.clauseResourceTypes() === Clause.RESOURCE_TYPE_PEOPLE;
  }
}
ShowSection.TYPE = ShowSection.prototype.TYPE = `show`;

export class GroupSection extends Section {
  get valid() {
    return super.valid &&
      this.clauses.every(clause => clause instanceof GroupClause);
  }

  isPeopleTimeSeries() {
    return this.clauses.length && this.clauses[this.clauses.length - 1].propertyType === `datetime`;
  }
}
GroupSection.TYPE = GroupSection.prototype.TYPE = `group`;

export class FilterSection extends Section {
  constructor(attrs={}) {
    super(...arguments);
    if (attrs && attrs.determiner && FilterSection.DETERMINER_TYPES.includes(attrs.determiner)) {
      this.determiner = attrs.determiner;
    } else {
      this.determiner = FilterSection.DETERMINER_ALL;
    }
    if (this.clauses && this.clauses.length < 2) {
      // reset to all when only one clause
      this.determiner = FilterSection.DETERMINER_ALL;
    }

  }

  get valid() {
    return super.valid &&
      this.clauses.every(clause => clause instanceof FilterClause) &&
      FilterSection.DETERMINER_TYPES.includes(this.determiner);
  }

  toUrlData() {
    const clauses = super.toUrlData();
    return clauses.length ? {clauses, determiner: this.determiner} : {};
  }
}

FilterSection.TYPE = FilterSection.prototype.TYPE = `filter`;
FilterSection.DETERMINER_ALL = FilterSection.prototype.DETERMINER_ALL = `all`;
FilterSection.DETERMINER_ANY = FilterSection.prototype.DETERMINER_ANY = `any`;
FilterSection.DETERMINER_TYPES = FilterSection.prototype.DETERMINER_TYPES = [
  FilterSection.DETERMINER_ALL,
  FilterSection.DETERMINER_ANY,
];

export class TimeSection extends Section {
  get valid() {
    return super.valid &&
      this.clauses.length === 1 &&
      this.clauses.every(clause => clause instanceof TimeClause);
  }
}
TimeSection.TYPE = TimeSection.prototype.TYPE = `time`;
