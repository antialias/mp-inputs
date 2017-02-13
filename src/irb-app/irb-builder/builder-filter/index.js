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
          this.app.updateSection(this.state.report.sections.filter);
        },
        getQueryDelimiter: () => {
          const conjunction = this.state.report.sections.filter.conjunction;
          let delimiter = `,`;
          if (this.state.report.sections.filter.clauses.length < 3) {
            if (conjunction === FilterSection.CONJUNCTION_ALL) {
              delimiter = `and`;
            } else if (conjunction === FilterSection.CONJUNCTION_ANY) {
              delimiter = `or`;
            }
          }
          return delimiter;
        },
        isAddingClause: () => this.app.isAddingClause(FilterClause.TYPE),
      },
    };
  }
});
