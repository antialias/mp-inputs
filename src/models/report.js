import moment from 'moment';

import { pick } from '../util';

// saveable / loadable report metadata
export default class Report {
  constructor(attrs) {
    this.id    = attrs.id;
    this.title = attrs.title;
    this.user  = attrs.user;

    if (attrs.modified) {
      this.modified = moment.utc(attrs.modified).local();
      this.modifiedStr = this.modified.format('MMM Do, YYYY');
    }
  }

  static deserialize(data) {
    return new Report(data);
  }

  serialize() {
    const serialized = pick(this, ['title']);
    if (this.id) {
      serialized.id = this.id;
    }
    return serialized;
  }
}
