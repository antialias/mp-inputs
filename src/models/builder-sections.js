import { extend, mapValues, pick } from 'mixpanel-common/build/util';
import { debug } from 'mixpanel-common/build/report/util';

import {
  Section,
  ShowSection,
  GroupSection,
  FilterSection,
  TimeSection,
} from './section';

export default class BuilderSections {
  constructor(attrs={}) {
    this.show = attrs.show || new ShowSection();
    this.group = attrs.group || new GroupSection();
    this.filter = attrs.filter || new FilterSection();
    this.time = attrs.time || new TimeSection();
  }

  static deserialize(attrs) {
    return new BuilderSections(
      mapValues(attrs, (clauseAttrs, sectionType) =>
        Section.deserialize(sectionType, clauseAttrs)
      )
    );
  }

  get attrs() {
    return pick(this, ['show', 'group', 'filter', 'time']);
  }

  getClause(type, clauseIndex) {
    return this[type].clauses[clauseIndex];
  }

  replaceSection(type, newSection) {
    return this.validate(new BuilderSections(extend(this.attrs, {[type]: newSection})));
  }

  serialize() {
    return mapValues(this.attrs, section => section.serialize());
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

    if (!valid) {
      debug.warn('sections invalid:', newSections);
    }

    return valid ? newSections : this;
  }
}
BuilderSections.TYPES = BuilderSections.prototype.TYPES = [
  'show', 'group', 'time', 'filter',
];
