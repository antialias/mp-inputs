import BaseView from '../base';

export default class PaneContentView extends BaseView {
  get TEMPLATE() {
    return template;
  }

  get templateHelpers() {
    return {
      matchesSearch: value => (
        this.app.state.editing && (
          !this.app.state.editing.search ||
          value.toLowerCase().indexOf(this.app.state.editing.search.toLowerCase()) === 0
        )
      ),
      updateClause: (clauseIndex, data) => this.app.updateClause(this.section, clauseIndex, data),
    };
  }
}
