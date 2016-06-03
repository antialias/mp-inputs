import { Component } from 'panel';

import { capitalize, extend } from '../../../util';
import { renameEvent, renameProperty } from '../../../util';

import { AddControl, EditControl } from '../controls';
import { BuilderPane, PropertyPaneContent, PropertyValuePaneContent } from '../controls/builder-pane';
import { Clause, ShowClause } from '../../../models/clause';
import { PaneContent } from '../../pane';

import template from './index.jade';
import showPaneContentTemplate from '../controls/show-pane-content.jade';
import './index.styl';

document.registerElement('builder-show', class extends Component {
  get config() {
    return {template};
  }
});

// controls
document.registerElement('show-add-control', class extends AddControl {
  get section() {
    return 'show';
  }

  get label() {
    return 'Compare';
  }
});

document.registerElement('show-edit-control', class extends EditControl {
  get section() {
    return 'show';
  }

  get label() {
    const clause = this.state.sections.getClause('show', this.clauseIndex);
    const math = capitalize(clause.math);
    return [math, ' number of ', renameEvent(clause.value)];
  }

  get isRemoveable() {
    return this.state.sections.show.clauses.length > 1;
  }
});

// dropdown content
document.registerElement('show-pane', class extends BuilderPane {
  get section() {
    return 'show';
  }

  get subpanes() {
    return [
      {
        tag: 'show-pane-content',
        constants: {
          header: 'Show',
        },
      },
      {
        tag: 'show-property-pane-content',
        constants: {
          header: 'Properties',
        },
      },
      {
        tag: 'show-property-value-pane-content',
        constants: {
          search: false,
          commitLabel: 'Update',
        },
        helpers: {
          commitHandler: () => this.app.commitStageClause(),
          getHeader: () => {
            const clause = this.app.activeStageClause();
            return clause && clause.value ? renameProperty(clause.value) : '';
          },
        },
      },
    ];
  }
});

document.registerElement('show-pane-content', class extends PaneContent {
  get config() {
    return extend(super.config, {
      template: showPaneContentTemplate,
      helpers: extend(super.config.helpers, {
        selectArrow: value => {
          this.app.updateStageClause({value});
          this.app.startAddingClause('group');
          window.requestAnimationFrame(() =>
            this.app.updateStageClause({paneIndex: 1})
          );
        },
      }),
    });
  }

  get constants() {
    return extend(super.constants, {
      mathChoices: ShowClause.MATH_TYPES,
      eventChoices: [ShowClause.TOP_EVENTS, ShowClause.ALL_EVENTS, ...this.state.topEvents],
    });
  }

  get section() {
    return 'show';
  }

  get resourceTypeChoices() {
    return Clause.RESOURCE_TYPES;
  }
});

document.registerElement('show-property-pane-content', class extends PropertyPaneContent {
  get section() {
    return 'show';
  }

});


document.registerElement('show-property-value-pane-content', class extends PropertyValuePaneContent {
  get section() {
    return 'show';
  }

});
