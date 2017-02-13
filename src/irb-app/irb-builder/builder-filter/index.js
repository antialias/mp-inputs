import { Component } from 'panel';

import { FilterClause } from '../../../models/clause';
import { FilterSection } from '../../../models/section';

import './builder-filter-add-control';
import './builder-filter-edit-control';
import './builder-screen-filter-property';
import './builder-screen-filter-properties-list';

import template from './index.jade';

import './index.styl';

document.registerElement(`query-builder-filter`, class extends Component {
  get config() {
    return {
      template,
      helpers: {
        clickedConjuctionToggle: () => {
          const filter = this.state.report.sections.filter;
          filter.conjunction = filter.conjunction === FilterSection.CONJUNCTION_ALL ? FilterSection.CONJUNCTION_ANY : FilterSection.CONJUNCTION_ALL;
          this.app.updateReport(this.state.report);
        },
        isAddingClause: () => this.app.isAddingClause(FilterClause.TYPE),
      },
    };
  }
});
