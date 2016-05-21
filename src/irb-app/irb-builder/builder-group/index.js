import { Component } from 'panel';

import { extend, renameProperty } from '../../../util';

import { AddControl, EditControl } from '../controls';
import { ShowClause } from '../../../models/clause';
// import { Clause, ShowClause } from '../../../models/clause';

import template from './index.jade';

document.registerElement('builder-group', class extends Component {
  get config() {
    return {
      template,

      helpers: {
        isDisabled: () => {
          const showValues = this.state.sections.show.clauses.map(clause => clause.value);
          return showValues.length > 1 || showValues.indexOf(ShowClause.TOP_EVENTS) !== -1;
        },
      },
    };
  }
});

document.registerElement('group-add-control', class extends AddControl {
  get constants() {
    return extend(super.constants, {
      label: 'Group',
    });
  }

  get section() {
    return 'group';
  }
});

document.registerElement('group-edit-control', class extends EditControl {
  get config() {
    return extend(super.config, {
      helpers: extend(super.config.helpers, {
        getLabel: () =>
          renameProperty(this.state.sections.getClause('group', this.clauseIndex).value),
      }),
    });
  }

  get constants() {
    return extend(super.constants, {
      label: 'Group',
    });
  }

  get section() {
    return 'group';
  }
});
