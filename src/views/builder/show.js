import BaseView from '../base';
import PaneView from './pane';
import ControlView from './control';
import {
  BUILDER_SECTION_SHOW,
  RESOURCE_VALUE_ALL,

} from '../../constants';
import { extend, capitalize } from '../../util';

import template from '../templates/builder/show.jade';
import showPaneContentTemplate from '../templates/builder/show_pane.jade'
import '../stylesheets/builder/show.styl';

class ShowPaneContentView extends BaseView {
  get TEMPLATE() {
    return showPaneContentTemplate;
  }
}

class ShowPaneView extends PaneView {
  get templateConstants() {
    return extend(super.templateConstants, {
      header: 'Show',
    });
  }

  get VIEWS() {
    return {
      content: new ShowPaneContentView(this),
    };
  }
}

class ShowControlView extends ControlView {
  get VIEWS() {
    return {
      pane: new ShowPaneView(this),
    };
  }
}

class AddControlView extends ShowControlView {
  get templateConstants() {
    return extend(super.templateConstants, {
      class: 'verb',
      label: 'Compare',
    });
  }

  get templateHelpers() {
    return extend(super.templateHelpers, {
      isPaneOpen: () => this.app.isAddingToSection(BUILDER_SECTION_SHOW),
      openPane: () => this.app.addToSection(BUILDER_SECTION_SHOW),
    });
  }
}

class EditControlView extends ShowControlView {
  get templateConstants() {
    return extend(super.templateConstants, {
      class: 'noun',
      labelConnector: ' of ',
    });
  }

  get templateHelpers() {
    return extend(super.templateHelpers, {
      isPaneOpen: props => this.app.isEditingSection(BUILDER_SECTION_SHOW, props.index),
      openPane: props => this.app.editSection(BUILDER_SECTION_SHOW, props.index),
      getLabel: props => {
        let comparison = this.app.state[BUILDER_SECTION_SHOW][props.index];
        let math = capitalize(comparison.math);
        let value = comparison.value === RESOURCE_VALUE_ALL ?
          `All ${capitalize(comparison.type)}` : comparison.value;

        return [math, value];
      },
    });
  }
}

export default class ShowView extends BaseView {
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
