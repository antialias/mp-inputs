import { View } from 'panel';

import PaneView from './pane';
import ControlView from './control';
import {
  BUILDER_SECTION_TIME,
} from '../../constants';

import template from '../templates/builder/time.jade';
import '../stylesheets/builder/time.styl';

class TimePaneView extends PaneView {
}

class EditControlView extends ControlView {
  get VIEWS() {
    return {
      pane: new TimePaneView(this),
    };
  }

  get templateHelpers() {
    return {
      isOpen: () => this.app.isEditingSection(BUILDER_SECTION_TIME, 0),
      getClass: () => 'noun',
      getLabel: () => {
        const timeSectionData = this.app.state[BUILDER_SECTION_TIME];

        if (timeSectionData.length === 1) {
          const { unit, start, end } = timeSectionData[0];

          if (start < 0 && end === null) {
            return `last ${Math.abs(start)} ${unit}s`;
          } else {
            throw new Error('Date range formatting not yet implemented.');
          }
        } else {
          return '';
        }
      },
    }
  }
}

export default class TimeView extends View {
  get TEMPLATE() {
    return template;
  }

  get VIEWS() {
    return {
      editControl: new EditControlView(this),
    };
  }
}
