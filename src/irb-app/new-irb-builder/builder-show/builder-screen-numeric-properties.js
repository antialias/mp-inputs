import { BuilderScreenPropertiesBase } from '../builder-pane/builder-screen-properties-base';
import { ShowClause } from '../../../models/clause';
import BaseQuery from '../../../models/queries/base';
import { extend } from '../../../util';

import template from './builder-screen-numeric-properties.jade';

document.registerElement(`builder-screen-numeric-properties`, class extends BuilderScreenPropertiesBase {
  get config() {
    return {
      template,
      helpers: extend(super.config.helpers, {
        toggleNonNumericProperties: () => this.app.updateBuilderCurrentScreen({
          showingNonNumericProperties: !this.isShowingNonNumericProperties(),
        }),
        clickedProperty: (ev, property) => this.updateAndCommitStageClause({property}),
      }),
    };
  }

  isLoading() {
    return this.state.topEventPropertiesByEvent[this.event] === BaseQuery.LOADING;
  }

  get event() {
    const stageClause = this.app.activeStageClause;
    return stageClause && stageClause.value && stageClause.value.name;
  }

  buildList() {
    let properties = this.state.topEventPropertiesByEvent[this.event];

    if (!properties) {
      if (this.event === ShowClause.TOP_EVENTS.name || this.event === ShowClause.ALL_EVENTS.name) {
        properties = this.state.topEventProperties;
      } else if (this.event) {
        this.app.fetchTopPropertiesForEvent(this.event);
      }
    }

    if (!Array.isArray(properties)) {
      properties = [];
    }

    if (!this.isShowingNonNumericProperties()) {
      properties = properties.filter(prop => prop.type === `number`);
    }

    return properties;
  }

  isShowingNonNumericProperties() {
    const screen = this.app.getBuilderCurrentScreen();
    return screen && !!screen.showingNonNumericProperties;
  }
});
