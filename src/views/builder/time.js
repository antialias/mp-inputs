import BaseView from '../base';
import { EditControlView } from './control';
import PaneView from './pane';
import PaneContentView from './pane-content';
import { extend } from '../../util';
import { register as registerDatePicker } from '../../elements/date-picker';

import template from '../templates/builder/time.jade';
import timePaneContentTemplate from '../templates/builder/time-pane-content.jade';

import '../stylesheets/builder/time.styl';

registerDatePicker();

class TimePaneContentView extends PaneContentView {
  get section() {
    return 'time';
  }

  get TEMPLATE() {
    return timePaneContentTemplate;
  }

  get templateHelpers() {
    return extend(super.templateHelpers, {
      updateClause: data => this.app.updateClause('time', 0, data),
      rangeToString: () => {
        const { from, to } = this.app.state.sections.getClause('time', 0);
        return JSON.stringify({from, to});
      },
    });
  }
}

class TimePaneView extends PaneView {
  get section() {
    return 'time';
  }

  get templateConstants() {
    return extend(super.templateConstants, {
      header: 'Time',
      search: false,
    });
  }

  get VIEWS() {
    return {
      content: new TimePaneContentView(this),
    };
  }
}

class TimeEditControlView extends EditControlView {
  get section() {
    return 'time';
  }

  get templateConstants() {
    return extend(super.templateConstants, {
      showRemove: false,
    });
  }

  get VIEWS() {
    return {
      pane: new TimePaneView(this),
    };
  }

  get templateHelpers() {
    return extend(super.templateHelpers, {
      getLabel: () => {
        const { unit, from, to } = this.app.state.sections.getClause('time', 0);
        const now = new Date();
        const startOfToday = new Date().setHours(0, 0, 0, 0);
        const hoursFromNow = Math.round(Math.abs(now - from) / (60 * 60 * 1000));

        if (hoursFromNow < 100) {
          return `last ${hoursFromNow} hours`;
        }

        const includeYear = from.getFullYear() !== to.getFullYear() ||
                          from.getFullYear() !== now.getFullYear();

        const formatDate = date =>
          `${date.getMonth() + 1}/${date.getDate()}` +
            (includeYear ? `/${date.getFullYear().toString().slice(2)}` : '');

        const fromFormatted = formatDate(from);
        const toFormatted = formatDate(to);

        return fromFormatted === toFormatted ? fromFormatted : `${fromFormatted} - ${toFormatted}`;
      },
    });
  }
}

export default class TimeView extends BaseView {
  get TEMPLATE() {
    return template;
  }

  get VIEWS() {
    return {
      editControl: new TimeEditControlView(this),
    };
  }
}
