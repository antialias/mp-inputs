import { Component } from 'panel';

import { FilterClause } from '../../../models/clause';

import './builder-filter-add-control';
// TODO import './builder-filter-edit-control';
import './builder-screen-filter-property';
import './builder-screen-filter-properties-list';

import template from './index.jade';

import './index.styl';

document.registerElement(`query-builder-filter`, class extends Component {
  get config() {
    return {
      template,
      helpers: {
        isAddingClause: () => this.app.isAddingClause(FilterClause.TYPE),
      },
    };
  }
});
