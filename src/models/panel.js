import moment from 'moment';
import _ from 'lodash';

export default class Panel {
  constructor(attrs={}) {
    this.id = attrs.id || _.uniqueId();
    this.name = attrs.name || `Panel ${this.id}`;

    if (attrs.modified) {
      this.modified = moment.utc(attrs.modified).local();
      this.modifiedStr = this.modified.format('MMM Do, YYYY');
    }
  }
}
