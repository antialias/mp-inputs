import BaseView from '../base';
import PaneView from './pane';
import ControlView from './control';
import {
  SECTION_GROUP,
  RESOURCE_TYPES,
} from '../../constants';
import { capitalize, extend } from '../../util';

import template from '../templates/builder/group.jade';
import groupPaneContentTemplate from '../templates/builder/group_pane.jade'
import '../stylesheets/builder/group.styl';

class GroupPaneContentView extends BaseView {
  get TEMPLATE() {
    return groupPaneContentTemplate;
  }

  get templateConstants() {
    return {
      resourceTypeChoices: Object.values(RESOURCE_TYPES),
    };
  }

  get templateHelpers() {
    return {
      capitalize,
      updateSection: data => this.app.updateSection(data),
    };
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
      isPaneOpen: () => this.app.isAddingSectionClause(SECTION_GROUP),
      openPane: () => this.app.startAddingSectionClause(SECTION_GROUP),
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
      isPaneOpen: props => this.app.isEditingSectionClause(SECTION_GROUP, props.index),
      openPane: props => this.app.startEditingSectionClause(SECTION_GROUP, props.index),
      getLabel: props => this.app.sectionClauseAt(SECTION_GROUP, props.index).value,
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
}
