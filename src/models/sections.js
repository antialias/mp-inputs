import { extend } from '../util';
import {
  ShowSection,
  GroupSection,
  FilterSection,
  TimeSection,
} from './section.js';

export default class Sections {
  constructor(attrs={}) {
    this.show = attrs.show || new ShowSection();
    this.group = attrs.group || new GroupSection();
    this.filter = attrs.filter || new FilterSection();
    this.time = attrs.time || new TimeSection();
  }

  get attrs() {
    let { show, group, filter, time } = this;
    return {show, group, filter, time};
  }

  get valid() {
    return (
      this.show instanceof ShowSection && this.show.valid &&
      this.group instanceof GroupSection && this.group.valid &&
      this.filter instanceof FilterSection && this.filter.valid &&
      this.time instanceof TimeSection && this.time.valid
    );
  }

  validate(newSections) {
    const valid = newSections.valid;

    if (APP_ENV === 'development' && !valid) {
      console.warn('sections invalid:', newSections);
    }

    return valid ? newSections : this;
  }

  get(type, clauseIndex) {
    return {
      section: this[type],
      clause: this[type].clauses[clauseIndex],
    };
  }

  getClause(type, clauseIndex) {
    let { section, clause } = this.get(type, clauseIndex);
    return clause;
  }

  replaceSection(type, newSection) {
    return this.validate(new Sections(extend(this.attrs, {[type]: newSection})));
  }
}
Sections.TYPES = Sections.prototype.TYPES = [
  'show', 'group', 'time', 'filter'
];
