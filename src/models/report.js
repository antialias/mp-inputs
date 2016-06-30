import moment from 'moment';

import BuilderSections from './builder-sections';
import { extend, pick } from '../util';

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
    return new Report(extend(data, {sections: BuilderSections.deserialize(data.sections)}));
  }

  serialize() {
    const serialized = extend({
      sections: this.sections.serialize(),
    }, pick(this, [
      'chartType',
      'series',
      'title',
    ]));
    if (this.id) {
      serialized.id = this.id;
    }
    return serialized;
  }
}
