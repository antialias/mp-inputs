import BaseView from '../base';
import PaneView from './pane';
import ControlView from './control';
import {
  SECTION_TIME,
} from '../../constants';
import { extend } from '../../util';

import template from '../templates/builder/time.jade';
import '../stylesheets/builder/time.styl';

class TimePaneView extends PaneView {
  get templateConstants() {
    return extend(super.templateConstants, {
      header: 'Time',
    });
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
      isPaneOpen: () => this.app.isEditingSectionClause(SECTION_TIME, 0),
      openPane: () => this.app.startEditingSectionClause(SECTION_TIME, 0),
      getLabel: () => {
        const { unit, start, end } = this.app.sectionClauseAt(SECTION_TIME, 0);

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
