import moment from 'moment';

import { pick } from '../util';

// saveable / loadable report metadata
export default class Report {
  constructor(attrs) {
    Object.assign(this, pick(attrs, [
      // metadata
      'id',
      'title',
      'user',

      // visualization params
      'chartType',
      'sections',
      'series',
    ]));

    if (attrs.modified) {
      this.modified = moment.utc(attrs.modified).local();
      this.modifiedStr = this.modified.format('MMM Do, YYYY');
    }
  }

  static deserialize(data) {

    // TODO deserialize sections
    // return extend(attrs, {sections: BuilderSections.deserialize(attrs.sections)});

    return new Report(data);
  }

  serialize() {
    const serialized = pick(this, ['title']);
    if (this.id) {
      serialized.id = this.id;
    }

    // TODO serialize sections etc

    return serialized;
  }
}
