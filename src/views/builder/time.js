import BaseView from '../base';
import PaneView from './pane';
import PaneContentView from './pane-content';
import ControlView from './control';
import {
  SECTION_TIME,
} from '../../constants';
import { extend } from '../../util';

import template from '../templates/builder/time.jade';
import timePaneContentTemplate from '../templates/builder/time-pane.jade'
import '../stylesheets/builder/time.styl';

class TimePaneContentView extends PaneContentView {
  get TEMPLATE() {
    return timePaneContentTemplate;
  }

  get templateHelpers() {
    return extend(super.templateHelpers, {
      updateSection: data => this.app.updateSection(data),
    });
  }

  render() {
    return super.render(...arguments);
    //$(`.${this.className} .date-picker`).MPDatepicker();
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
        const { unit, start, end } = this.app.clauseAt(SECTION_TIME, 0);

        if (start < 0 && end === null) {
          return `last ${Math.abs(start)} ${unit}s`;
        } else {
          throw new Error('Date range formatting not yet implemented.');
        }
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
