import { BuilderScreenPropertiesBase } from '../builder-pane/builder-screen-properties-base';
import { ShowClause } from '../../../models/clause';

import {
  extend,
} from '../../../util';

import template from './builder-screen-people.jade';

document.registerElement(`builder-screen-people`, class extends BuilderScreenPropertiesBase {
  get config() {
    return {
      template,
      helpers: extend(super.config.helpers, {
        clickedProperty: (ev, property) => {
          const stageClause = {
            property,
            value: ShowClause.ALL_PEOPLE,
          };
          this.updateStageClause(stageClause, {shouldCommit: true, shouldStopEditing: true});
        },
        clickedSpecialOptions: (ev, value) => {
          this.updateStageClause({value, property: null}, {shouldCommit: true, shouldStopEditing: true});
        },
        getSpecialOptions: () => ([
          extend(ShowClause.ALL_PEOPLE, {icon: `profile`}),
        ]),
        isLoading: () => !this.state.topPeopleProperties,
        toggleNonNumericProperties: () => this.app.updateBuilderCurrentScreen({
          showingNonNumericProperties: !this.isShowingNonNumericProperties(),
        }),
      }),
    };
  }

  buildList() {
    let properties = this.state.topPeopleProperties;
    if (!this.isShowingNonNumericProperties()) {
      properties = properties && properties.filter(prop => prop.type === `number`);
    }
    return properties || [];
  }

  isShowingNonNumericProperties() {
    const screen = this.app.getBuilderCurrentScreen();
    return screen && !!screen.showingNonNumericProperties;
  }
});
