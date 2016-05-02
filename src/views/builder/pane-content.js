import BaseView from '../base';

export default class PaneContentView extends BaseView {
  get TEMPLATE() {
    return template;
  }

  get templateHelpers() {
    return {
      matchesSearch: value => (
        this.app.state.stageClause && (
          !this.app.state.stageClause.search ||
          value.toLowerCase().indexOf(this.app.state.stageClause.search.toLowerCase()) === 0
        )
      ),
      updateStageClause: (clauseData, commit) => {
        this.app.updateStageClause(clauseData);
        if (commit) {
          this.app.commitStageClause();
        }
      },
      commitStageClause: () => this.app.commitStageClause(),
    };
  }
}
