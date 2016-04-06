import BaseView from '../base';
import ControlView from './control';
import PaneView from './pane';
import PaneContentView from './pane-content';
import {
  SECTION_GROUP,
  RESOURCE_TYPES,
} from '../../constants';
import {
  capitalize,
  extend,
  renameProperty,
} from '../../util';

import template from '../templates/builder/group.jade';
import groupPaneContentTemplate from '../templates/builder/group-pane-content.jade'
import '../stylesheets/builder/group.styl';
import '../stylesheets/builder/group-pane-content.styl';

class GroupPaneContentView extends PaneContentView {
  get TEMPLATE() {
    return groupPaneContentTemplate;
  }

  get templateConstants() {
    return {
      resourceTypeChoices: Object.values(RESOURCE_TYPES),
    };
  }

  get templateHelpers() {
    return extend(super.templateHelpers, {
      capitalize,
      renameProperty,
      updateSection: (index, data) => this.app.updateSection(SECTION_GROUP, index, data),
    });
  }
}

class GroupPaneView extends PaneView {
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

  get templateHandlers() {
    return {
      updateSearch: (index, search) => this.app.updateSection(SECTION_GROUP, index, {search}),
    }
  }
}

class GroupControlView extends ControlView {
  get VIEWS() {
    return {
      pane: new GroupPaneView(this),
    };
  }
}

class AddControlView extends GroupControlView {
  get templateConstants() {
    return extend(super.templateConstants, {
      class: 'verb',
      label: 'Group',
    });
  }

  get templateHelpers() {
    return extend(super.templateHelpers, {
      isPaneOpen: () => this.app.isAddingClause(SECTION_GROUP),
      openPane: () => this.app.startAddingClause(SECTION_GROUP),
    });
  }
}

class EditControlView extends GroupControlView {
  get templateConstants() {
    return extend(super.templateConstants, {
      class: 'noun',
    });
  }

  get templateHelpers() {
    return extend(super.templateHelpers, {
      isPaneOpen: index => this.app.isEditingClause(SECTION_GROUP, index),
      openPane: index => this.app.startEditingClause(SECTION_GROUP, index),
      getLabel: index => renameProperty(this.app.clauseAt(SECTION_GROUP, index).value),
    })
  }
}

export default class GroupView extends BaseView {
  get TEMPLATE() {
    return template;
  }

  get VIEWS() {
    return {
      addControl: new AddControlView(this),
      editControl: new EditControlView(this),
    };
  }

  get templateHelpers() {
    return extend(super.templateHelpers, {extend});
  }
}
