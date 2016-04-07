import BaseView from '../base';
import { AddControlView, EditControlView } from './control';
import PaneView from './pane';
import PaneContentView from './pane-content';
import {
  SECTION_GROUP,
  RESOURCE_TYPES,
} from '../../constants';
import {
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

class GroupAddControlView extends AddControlView {
  get section() {
    return SECTION_GROUP;
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
    return SECTION_GROUP;
  }

  get VIEWS() {
    return {
      pane: new GroupPaneView(this),
    };
  }

  get templateHelpers() {
    return extend(super.templateHelpers, {
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
      addControl: new GroupAddControlView(this),
      editControl: new GroupEditControlView(this),
    };
  }
}
