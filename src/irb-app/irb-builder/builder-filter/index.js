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
        clickedDeterminerToggle: () => {
          const filter = this.state.report.sections.filter;
          filter.determiner = filter.determiner === FilterSection.DETERMINER_ALL ? FilterSection.DETERMINER_ANY : FilterSection.DETERMINER_ALL;
          this.app.updateSection(filter);
        },
        getQueryDelimiter: () => {
          const determiner = this.state.report.sections.filter.determiner;
          let delimiter = `,`;
          if (this.state.report.sections.filter.clauses.length < 3) {
            if (determiner === FilterSection.DETERMINER_ALL) {
              delimiter = `and`;
            } else if (determiner === FilterSection.DETERMINER_ANY) {
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
