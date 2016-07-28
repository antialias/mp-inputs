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
      case 'show': return new ShowSection(attrs);
      case 'group': return new GroupSection(attrs);
      case 'filter': return new FilterSection(attrs);
      case 'time': return new TimeSection(attrs);
    }
  }

  static deserialize(sectionType, clauseAttrs) {
    return Section.create(sectionType, {
      clauses: clauseAttrs.map(c => Clause.create(sectionType, c)),
    });
  }

  create() {
    return Section.create(...arguments);
  }

  serialize() {
    return this.clauses.map(c => c.serialize());
  }

  validate(newSection) {
    const valid = newSection.valid;

    if (!valid) {
      debug.warn(`${this.TYPE} section invalid:`, newSection);
    }

    return valid ? newSection : this;
  }

  appendClause(newClause) {
    return this.validate(Section.create(this.TYPE, {clauses: insertAtIndex(this.clauses, this.clauses.length, newClause)}));
  }

  insertClause(index, newClause) {
    return this.validate(Section.create(this.TYPE, {clauses: insertAtIndex(this.clauses, index, newClause)}));
  }

  replaceClause(index, newClause) {
    return this.validate(Section.create(this.TYPE, {clauses: replaceByIndex(this.clauses, index, newClause)}));
  }

  removeClause(index) {
    return this.validate(Section.create(this.TYPE, {clauses: removeByIndex(this.clauses, index)}));
  }
}

export class ShowSection extends Section {
  get valid() {
    return super.valid &&
      this.clauses.every(clause => clause instanceof ShowClause);
  }
}
ShowSection.TYPE = ShowSection.prototype.TYPE = 'show';

export class GroupSection extends Section {
  get valid() {
    return super.valid &&
      this.clauses.every(clause => clause instanceof GroupClause);
  }
}
GroupSection.TYPE = GroupSection.prototype.TYPE = 'group';

export class FilterSection extends Section {
  get valid() {
    return super.valid &&
      this.clauses.every(clause => clause instanceof FilterClause);
  }
}
FilterSection.TYPE = FilterSection.prototype.TYPE = 'filter';

export class TimeSection extends Section {
  get valid() {
    return super.valid &&
      this.clauses.length === 1 &&
      this.clauses.every(clause => clause instanceof TimeClause);
  }
}
TimeSection.TYPE = TimeSection.prototype.TYPE = 'time';
