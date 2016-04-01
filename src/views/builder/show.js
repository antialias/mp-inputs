import BaseView from '../base';
import PaneView from './pane';
import ControlView from './control';
import {
  SECTION_SHOW,
  RESOURCE_VALUE_ALL,
  RESOURCE_TYPES,
  MATH_TYPES,
} from '../../constants';
import {
  capitalize,
  extend,
  renameEvent,
} from '../../util';

import template from '../templates/builder/show.jade';
import showPaneContentTemplate from '../templates/builder/show-pane.jade'
import '../stylesheets/builder/show.styl';

class ShowPaneContentView extends BaseView {
  get TEMPLATE() {
    return showPaneContentTemplate;
  }

  get templateConstants() {
    return {
      mathChoices: Object.values(MATH_TYPES),
      resourceTypeChoices: Object.values(RESOURCE_TYPES),
    };
  }

  get templateHelpers() {
    return {
      capitalize,
      renameEvent,
      updateSection: data => this.app.updateSection(data),
    };
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
      isPaneOpen: () => this.app.isAddingClause(SECTION_SHOW),
      openPane: () => this.app.startAddingClause(SECTION_SHOW),
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
      isPaneOpen: props => this.app.isEditingClause(SECTION_SHOW, props.index),
      openPane: props => this.app.startEditingClause(SECTION_SHOW, props.index),
      getLabel: props => {
        let comparison = this.app.clauseAt(SECTION_SHOW, props.index);
        let math = capitalize(comparison.math);
        let value = comparison.value === RESOURCE_VALUE_ALL ?
          `All ${capitalize(comparison.type)}` : comparison.value;

        return [math, renameEvent(value)];
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
