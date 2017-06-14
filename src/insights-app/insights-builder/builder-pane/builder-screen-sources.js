import {BuilderScreenBase} from './builder-screen-base';
import {Clause} from '../../../models/clause';
import {extend} from '../../../util';

import template from './builder-screen-sources.jade';

document.registerElement(`builder-screen-sources`, class extends BuilderScreenBase {
  get config() {
    return {
      template,
      helpers: extend(super.config.helpers, {
        RESOURCE_TYPE_ALL: Clause.RESOURCE_TYPE_ALL,
        getSources: () => {
          this.updateRenderedSizeOnNextFrame();
          return this.app.getSources().map((source, index) => extend(source, {index}));
        },
        getSelectedSource: () => this.app.getSelectedSource(this.app.originStageClause),
        clickedSource: ev => {
          const source = ev.detail.selected;
          const clauseAttrs = {value: {}};

          if ([Clause.RESOURCE_TYPE_EVENTS, Clause.RESOURCE_TYPE_ALL].includes(source)) {
            clauseAttrs.resourceType = source;
            clauseAttrs.profileType = null;
          } else {
            clauseAttrs.resourceType = Clause.RESOURCE_TYPE_PEOPLE;
            clauseAttrs.profileType = source;
          }

          this.updateStageClause(clauseAttrs);
          this.updateRenderedSizeOnNextFrame();
        },
        getSections: () => this.buildSections(),
        updateRenderedSizeOnNextFrame: () => this.updateRenderedSizeOnNextFrame(),
        shouldShowSourceUpsell: resourceType => this.app.shouldUpsellForSource(resourceType),
        shouldShowSourceAlert: resourceType => this.app.shouldAlertForSource(resourceType),
      }),
    };
  }
});
