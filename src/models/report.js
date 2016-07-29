import moment from 'moment';

import BuilderSections from './builder-sections';
import Legend from './legend';
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
      'displayOptions',
      'sections',
      'series',
      'sorting',
    ]));

    if (attrs.modified) {
      this.modified = moment.utc(attrs.modified).local();
      this.modifiedStr = this.modified.format('MMM Do, YYYY');
    }
  }

  static deserialize(data) {
    return new Report(extend(data, {sections: BuilderSections.deserialize(data.sections), series: new Legend(data.series)}));
  }

  serialize() {
    const serialized = extend({
      sections: this.sections.serialize(),
    }, pick(this, [
      'displayOptions',
      'series',
      'sorting',
      'title',
    ]));
    if (this.id) {
      serialized.id = this.id;
    }
    return serialized;
  }

  // MP bookmarks
  static fromBookmarkData(bookmark) {
    return Report.deserialize(extend(pick(bookmark, ['id', 'user']), JSON.parse(bookmark.params)));
  }

  toBookmarkData() {
    let bm = extend({name: this.title}, this.serialize());
    if (this.id) {
      bm.id = this.id;
    }
    return bm;
  }
}
