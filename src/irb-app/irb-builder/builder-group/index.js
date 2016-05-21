import { Component } from 'panel';

import { extend } from '../../../util';

import { AddControl } from '../controls';
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
