import BaseView from '../base';
import { AddControlView, EditControlView } from './control';
import PaneView from './pane';
import PaneContentView from './pane-content';
import {
  SECTION_FILTER,
  RESOURCE_TYPES,
} from '../../constants';
import {
  extend,
  renameProperty,
} from '../../util';

import template from '../templates/builder/filter.jade';
import filterPaneContentTemplate from '../templates/builder/filter-pane-content.jade';
import '../stylesheets/builder/filter.styl';
import '../stylesheets/builder/filter-pane-content.styl';

class FilterPaneContentView extends PaneContentView {
  get section() {
    return SECTION_FILTER;
  }

  get TEMPLATE() {
    return filterPaneContentTemplate;
  }

  get templateConstants() {
    return extend(super.templateConstants, {
      resourceTypeChoices: Object.values(RESOURCE_TYPES),
    });
  }
}

class FilterPaneView extends PaneView {
  get section() {
    return SECTION_FILTER;
  }

  get templateConstants() {
    return extend(super.templateConstants, {
      header: 'Properties',
    });
  }

  get VIEWS() {
    return {
      content: new FilterPaneContentView(this),
    };
  }
}

class FilterAddControlView extends AddControlView {
  get section() {
    return SECTION_FILTER;
  }

  get VIEWS() {
    return {
      pane: new FilterPaneView(this),
    };
  }


  get templateConstants() {
    return extend(super.templateConstants, {
      label: 'Filter',
    });
  }
}

class FilterEditControlView extends EditControlView {
  get section() {
    return SECTION_FILTER;
  }

  get VIEWS() {
    return {
      pane: new FilterPaneView(this),
    };
  }

  get templateHelpers() {
    return extend(super.templateHelpers, {
      getLabel: index => renameProperty(this.app.clauseAt(SECTION_FILTER, index).value),
    });
  }
}

export default class FilterView extends BaseView {
  get TEMPLATE() {
    return template;
  }

  get VIEWS() {
    return {
      addControl: new FilterAddControlView(this),
      editControl: new FilterEditControlView(this),
    };
  }
}
