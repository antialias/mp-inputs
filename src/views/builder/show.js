import { View } from 'panel';

import PaneView from './pane';
import ControlView from './control';
import {
  BUILDER_SECTION_SHOW,
  RESOURCE_VALUE_ALL,
} from '../../constants';
import { extend, capitalize } from '../../util';

import template from '../templates/builder/show.jade';
import '../stylesheets/builder/show.styl';

class ShowPaneView extends PaneView {
}

class ShowControlView extends ControlView {
  get VIEWS() {
    return {
      pane: new ShowPaneView(this),
    };
  }
}

class AddControlView extends ShowControlView {
  get templateHelpers() {
    return extend(super.templateHelpers, {
      isOpen: () => this.app.isAddingToSection(BUILDER_SECTION_SHOW),
      getClass: () => 'verb',
      getLabel: () => 'Compare',
    });
  }
}

class EditControlView extends ShowControlView {
  render(state, index) {
    this.index = index;
    return super.render(state);
  }

  get templateHelpers() {
    return extend(super.templateHelpers, {
      isOpen: () => this.app.isEditingSection(BUILDER_SECTION_SHOW, this.index),
      getClass: () => 'noun',
      getLabel: () => {
        let comparison = this.app.state[BUILDER_SECTION_SHOW][this.index];
        let math = capitalize(comparison.math);
        let value = comparison.value === RESOURCE_VALUE_ALL ?
          capitalize(comparison.type) : comparison.value;

        return [math, value];
      },
      getLabelConnector: () => ' of ',
    });
  }
}

export default class ShowView extends View {
  get TEMPLATE() {
    return template;
  }

  get VIEWS() {
    return {
      addControl: new AddControlView(this),
      editControl: new EditControlView(this),
    };
  }
}
