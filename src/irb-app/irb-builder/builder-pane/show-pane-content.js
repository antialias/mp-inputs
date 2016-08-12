import { ShowClause } from '../../../models/clause';
import { PaneContent } from '../../pane';
import { extend } from '../../../util';

import template from './show-pane-content.jade';

document.registerElement('show-pane-content', class extends PaneContent {
  get config() {
    return extend(super.config, {
      template,
      helpers: extend(super.config.helpers, {
        onArrowClick: (ev, value) => {
          ev.stopPropagation();
          this.app.updateStageClause({value});
          this.app.startAddingClause('group');
          window.requestAnimationFrame(() =>
            this.app.updateStageClause({paneIndex: 1})
          );
        },
        showResource: (resourceType, selectedResourceType) => {
          return selectedResourceType === 'all' || selectedResourceType === resourceType;
        },
      }),
    });
  }

  get constants() {
    return extend(super.constants, {
      mathChoices: ShowClause.MATH_TYPES,
    });
  }

  get eventChoices() {
    return [ShowClause.TOP_EVENTS, ShowClause.ALL_EVENTS, ...this.state.topEvents];
  }

  get section() {
    return 'show';
  }

  get resourceTypeChoices() {
    return ShowClause.RESOURCE_TYPES;
  }
});
