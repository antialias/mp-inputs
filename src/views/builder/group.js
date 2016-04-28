import BaseView from '../base';
import { AddControlView, EditControlView } from './control';
import PaneView from './pane';
import PaneContentView from './pane-content';
import {
  extend,
  renameProperty,
} from '../../util';

import { Clause, GroupClause, ShowClause } from '../../models/clause';

import template from '../templates/builder/group.jade';
import propertyPaneTemplate from '../templates/builder/property-pane-content.jade';

import '../stylesheets/builder/group.styl';

class GroupPaneContentView extends PaneContentView {
  get section() {
    return 'group';
  }

  get TEMPLATE() {
    return propertyPaneTemplate;
  }

  get templateConstants() {
    return extend(super.templateConstants, {
      resourceTypeChoices: Clause.RESOURCE_TYPES,
    });
  }

  get templateHelpers() {
    return extend(super.templateHelpers, {
      selectProperty: (clauseIndex, property) => {
        this.templateHelpers.updateClause(clauseIndex, {
          value: property.name,
        });
      },
    });
  }
}

class GroupPaneView extends PaneView {
  get section() {
    return 'group';
  }

  get templateConstants() {
    return extend(super.templateConstants, {
      header: 'Properties',
    });
  }

  get VIEWS() {
    return {
      content: new GroupPaneContentView(this),
    };
  }
}

class GroupAddControlView extends AddControlView {
  get section() {
    return 'group';
  }

  get VIEWS() {
    return {
      pane: new GroupPaneView(this),
    };
  }

  get templateConstants() {
    return extend(super.templateConstants, {
      label: 'Group',
    });
  }
}

class GroupEditControlView extends EditControlView {
  get section() {
    return 'group';
  }

  get VIEWS() {
    return {
      pane: new GroupPaneView(this),
    };
  }

  get templateHelpers() {
    return extend(super.templateHelpers, {
      getLabel: clauseIndex => renameProperty(this.app.state.sections.getClause('group', clauseIndex).value),
    });
  }
}

export default class GroupView extends BaseView {
  get TEMPLATE() {
    return template;
  }

  get VIEWS() {
    return {
      addControl: new GroupAddControlView(this),
      editControl: new GroupEditControlView(this),
    };
  }

  get templateHelpers() {
    return {
      isDisabled: () => {
        const showValues = this.app.state.sections.show.clauses.map(clause => clause.value);
        return showValues.length > 1 || showValues.indexOf(ShowClause.TOP_EVENTS) !== -1;
      },
    };
  }
}
