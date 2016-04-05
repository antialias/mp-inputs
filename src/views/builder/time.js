import BaseView from '../base';
import PaneView from './pane';
import PaneContentView from './pane-content';
import ControlView from './control';
import {
  SECTION_TIME,
} from '../../constants';
import { extend } from '../../util';
import { register as registerDatePicker } from '../../elements/date-picker';

import template from '../templates/builder/time.jade';
import timePaneContentTemplate from '../templates/builder/time-pane-content.jade';
import '../stylesheets/builder/time.styl';
import '../stylesheets/builder/time-pane.styl';
import '../stylesheets/builder/time-pane-content.styl';

registerDatePicker();

class TimePaneContentView extends PaneContentView {
  get TEMPLATE() {
    return timePaneContentTemplate;
  }

  get templateHelpers() {
    return extend(super.templateHelpers, {
      updateSection: data => this.app.updateSection(SECTION_TIME, 0, data),
      rangeToString: () => JSON.stringify(this.app.clauseAt(SECTION_TIME, 0).range),
    });
  }
}

class TimePaneView extends PaneView {
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

class EditControlView extends ControlView {
  get templateConstants() {
    return extend(super.templateConstants, {
      class: 'noun',
    });
  }

  get VIEWS() {
    return {
      pane: new TimePaneView(this),
    };
  }

  get templateHelpers() {
    return {
      isPaneOpen: () => this.app.isEditingClause(SECTION_TIME, 0),
      openPane: () => this.app.startEditingClause(SECTION_TIME, 0),
      getLabel: () => {
        const { unit, range } = this.app.clauseAt(SECTION_TIME, 0);
        const { from, to } = range;
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
    }
  }
}

export default class TimeView extends BaseView {
  get TEMPLATE() {
    return template;
  }

  get VIEWS() {
    return {
      editControl: new EditControlView(this),
    };
  }
}
