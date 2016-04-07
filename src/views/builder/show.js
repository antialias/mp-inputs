import BaseView from '../base';
import { AddControlView, EditControlView } from './control';
import PaneView from './pane';
import PaneContentView from './pane-content';
import {
  SECTION_SHOW,
  RESOURCE_VALUE_TOP_EVENTS,
  RESOURCE_TYPES,
  MATH_TYPES,
} from '../../constants';
import {
  capitalize,
  extend,
  renameEvent,
} from '../../util';

import template from '../templates/builder/show.jade';
import showPaneContentTemplate from '../templates/builder/show-pane-content.jade'
import '../stylesheets/builder/show.styl';
import '../stylesheets/builder/show-pane-content.styl';

class ShowPaneContentView extends PaneContentView {
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
    return extend(super.templateHelpers, {
      updateSection: (index, data) => this.app.updateSection(SECTION_SHOW, index, data),
    });
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

  get templateHandlers() {
    return {
      updateSearch: (index, search) => this.app.updateSection(SECTION_SHOW, index, {search}),
    }
  }
}

class ShowAddControlView extends AddControlView {
  get section() {
    return SECTION_SHOW;
  }

  get VIEWS() {
    return {
      pane: new ShowPaneView(this),
    };
  }

  get templateConstants() {
    return extend(super.templateConstants, {
      label: 'Compare',
    });
  }
}

class ShowEditControlView extends EditControlView {
  get section() {
    return SECTION_SHOW;
  }

  get VIEWS() {
    return {
      pane: new ShowPaneView(this),
    };
  }

  get templateConstants() {
    return extend(super.templateConstants, {
      labelConnector: ' of ',
    });
  }

  get templateHelpers() {
    return extend(super.templateHelpers, {
      getLabel: index => {
        let comparison = this.app.clauseAt(SECTION_SHOW, index);
        let math = capitalize(comparison.math);
        let value = comparison.value === RESOURCE_VALUE_TOP_EVENTS ?
          `Top ${capitalize(comparison.type)}` : comparison.value;

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
      addControl: new ShowAddControlView(this),
      editControl: new ShowEditControlView(this),
    };
  }
}
