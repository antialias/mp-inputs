import { BuilderScreenPropertiesBase } from '../builder-pane/builder-screen-properties-base';
import { extend } from '../../../util';

import template from './builder-screen-numeric-properties.jade';

document.registerElement(`builder-screen-numeric-properties`, class extends BuilderScreenPropertiesBase {
  get config() {
    return {
      template,
      helpers: extend(super.config.helpers, {
        clickedProperty: (ev, property) => this.updateAndCommitStageClause({property}),
        toggleNonNumericProperties: () => this.app.updateBuilderCurrentScreen({
          showingNonNumericProperties: !this.isShowingNonNumericProperties(),
        }),
      }),
    };
  }

  getRelevantBuilderEvents() {
    const stageClause = this.app.activeStageClause;
    return stageClause && stageClause.value ? [stageClause.value.name] : [];
  }

  isShowingNonNumericProperties() {
    const screen = this.app.getBuilderCurrentScreen();
    return screen && !!screen.showingNonNumericProperties;
  }

  isLoading() {
    return this.state.topEventPropertiesByEvent[this.event] === BaseQuery.LOADING;
  }

  buildList() {
    const properties = super.buildList();

    if (this.isShowingNonNumericProperties()) {
      return properties;
    } else {
      return properties.filter(prop => prop.type === `number`);
    }
  }
});
