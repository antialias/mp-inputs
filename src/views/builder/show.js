import BaseView from '../base';
import { AddControlView, EditControlView } from './control';
import PaneView from './pane';
import PaneContentView from './pane-content';
import {
  capitalize,
  extend,
  renameEvent,
} from '../../util';

import { Clause, ShowClause } from '../../models/clause';

import template from '../templates/builder/show.jade';
import showPaneContentTemplate from '../templates/builder/show-pane-content.jade';

import '../stylesheets/builder/show.styl';

class ShowPaneContentView extends PaneContentView {
  get section() {
    return 'show';
  }

  get TEMPLATE() {
    return showPaneContentTemplate;
  }

  get templateConstants() {
    return extend(super.templateConstants, {
      mathChoices: ShowClause.MATH_TYPES,
      resourceTypeChoices: Clause.RESOURCE_TYPES,
      eventChoices: [ShowClause.TOP_EVENTS, ...this.app.state.topEvents],
    });
  }
}

class ShowPaneView extends PaneView {
  get section() {
    return 'show';
  }

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

class ShowAddControlView extends AddControlView {
  get section() {
    return 'show';
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
    return 'show';
  }

  get VIEWS() {
    return {
      pane: new ShowPaneView(this),
    };
  }

  get templateHelpers() {
    return extend(super.templateHelpers, {
      getLabel: clauseIndex => {
        const clause = this.app.state.sections.getClause('show', clauseIndex);
        const math = capitalize(clause.math);

        return [math, ' of ', renameEvent(clause.value)];
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
