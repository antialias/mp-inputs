import moment from 'moment';

import BuilderSections from './builder-sections';
import Legend from './legend';
import { extend, pick } from '../util';

const BOOKMARK_ATTRS = [
  `id`,
  `modified`,
  `user`,
  `user_id`,
];

// saveable / loadable report metadata
export default class Report {
  constructor(attrs) {
    Object.assign(this, pick(attrs, [
      // metadata
      ...BOOKMARK_ATTRS,
      `title`,

      // visualization params
      `displayOptions`,
      `sections`,
      `legend`,
      `sorting`,
    ]));
    this.userID = this.user_id;

    if (attrs.modified) {
      this.modified = moment.utc(attrs.modified).local();
      this.modifiedStr = this.modified.format(`MMM Do, YYYY`);
    }
  }

  static deserialize(data) {
    return new Report(extend(data, {
      sections: BuilderSections.deserialize(data.sections),
      legend: new Legend(data.legend),
    }));
  }

  serialize() {
    const serialized = extend({
      sections: this.sections.serialize(),
    }, pick(this, [
      `displayOptions`,
      `legend`,
      `sorting`,
      `title`,
    ]));
    if (this.id) {
      serialized.id = this.id;
    }
    return serialized;
  }

  // MP bookmarks
  static fromBookmarkData(bookmark) {
    return Report.deserialize(extend(pick(bookmark, BOOKMARK_ATTRS), JSON.parse(bookmark.params)));
  }

  toBookmarkData() {
    let bm = extend({name: this.title, icon: this.displayOptions.chartType}, this.serialize());
    if (this.id) {
      bm.id = this.id;
    }
    return bm;
  }

  _listOfSectionValues(section) {
    const reportSection = this.sections[section];
    return reportSection && reportSection.clauses.map(clause => clause.TYPE === `show` ? clause.value.name : clause.value);
  }

  toTrackingData() {
    const compareClauses = this._listOfSectionValues(`show`);
    const groupClauses = this._listOfSectionValues(`group`);
    const filterClauses = this._listOfSectionValues(`filter`);
    const timeClause = this.sections[`time`].clauses[0];

    const trackingData = {
      'report info: title': this.title,
      'report info: type': this.displayOptions.chartType,
      'report info: style': this.displayOptions.plotStyle,
      'report info: analysis': this.displayOptions.analysis,
      'report info: value': this.displayOptions.value,
      'report info: list of Compare clauses': compareClauses,
      'report info: list of Group By clauses': groupClauses,
      'report info: list of Filter clauses': filterClauses,
      'report info: # of Compare clauses': compareClauses.length,
      'report info: # of Group By clauses': groupClauses.length,
      'report info: # of Filter clauses': filterClauses.length,
      'report info: time unit': timeClause.unit,
      'report info: time value': timeClause.value,
    };
    if (this.id) {
      trackingData[`report id`] = this.id;
    }
    return trackingData;
  }
}
