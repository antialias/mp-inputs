import { View } from 'panel';

import PaneView from './pane';
import ControlView from './control';
import {
  BUILDER_SECTION_GROUP,
} from '../../constants';
import { extend } from '../../util';

import template from '../templates/builder/group.jade';
import '../stylesheets/builder/group.styl';

class GroupPaneView extends PaneView {
}

class GroupControlView extends ControlView {
  get VIEWS() {
    return {
      pane: new GroupPaneView(this),
    };
  }
}

class AddControlView extends GroupControlView {
  get templateHelpers() {
    return extend(super.templateHelpers, {
      isOpen: () => this.app.isAddingToSection(BUILDER_SECTION_GROUP),
      getClass: () => 'verb',
      getLabel: () => 'Group',
    })
  }
}

class EditControlView extends GroupControlView {
  render(state, index) {
    this.index = index;
    super.render(state);
  }

  get templateHelpers() {
    return extend(super.templateHelpers, {
      isOpen: () => this.app.isEditingSection(BUILDER_SECTION_GROUP, this.index),
      getClass: () => 'noun',
      getLabel: () => this.app.state[BUILDER_SECTION_GROUP][this.index].value,
    })
  }
}

export default class GroupView extends View {
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
