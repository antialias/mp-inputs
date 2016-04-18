import BaseView from '../base';

export default class PaneContentView extends BaseView {
  get TEMPLATE() {
    return template;
  }

  get templateHelpers() {
    return {
      matchesSearch: value => (
        this.app.state.editingClause && (
          !this.app.state.editingClause.search ||
          value.toLowerCase().indexOf(this.app.state.editingClause.search.toLowerCase()) === 0
        )
      ),
      updateClause: (clauseIndex, data) => this.app.updateClause(this.section, clauseIndex, data),
    };
  }
}
