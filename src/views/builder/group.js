import BaseView from '../base';
import PaneView from './pane';
import ControlView from './control';
import {
  BUILDER_SECTION_GROUP,
} from '../../constants';
import { extend } from '../../util';

import template from '../templates/builder/group.jade';
import '../stylesheets/builder/group.styl';

class GroupPaneView extends PaneView {
  get templateConstants() {
    return extend(super.templateConstants, {
      header: 'Properties',
    });
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
      isPaneOpen: () => this.app.isAddingToSection(BUILDER_SECTION_GROUP),
      openPane: () => this.app.addToSection(BUILDER_SECTION_GROUP),
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
      isPaneOpen: props => this.app.isEditingSection(BUILDER_SECTION_GROUP, props.index),
      openPane: props => this.app.editSection(BUILDER_SECTION_GROUP, props.index),
      getLabel: props => this.app.state[BUILDER_SECTION_GROUP][props.index].value,
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
