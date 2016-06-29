import moment from 'moment';

import { pick } from '../util';

// saveable / loadable report metadata
export default class Report {
  constructor(attrs) {
    this.id    = attrs.id;
    this.title = attrs.title;
    this.user  = attrs.user;

    // TODO: deal with these attrs
    // chartType: 'bar',
    // sections: new BuilderSections({
    //   show: new ShowSection(new ShowClause({value: ShowClause.TOP_EVENTS})),
    //   time: new TimeSection(new TimeClause({range: TimeClause.RANGES.HOURS})),
    // }),
    // series: {
    //   currentSeries: null,
    //   data: {},
    //   isEditing: false,
    //   search: null,
    // },

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
