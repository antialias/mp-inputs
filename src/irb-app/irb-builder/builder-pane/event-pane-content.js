import { ShowClause } from '../../../models/clause';
import { PaneContent } from '../../pane';
import { extend, renameEvent } from '../../../util';

import template from './event-pane-content.jade';

document.registerElement('event-pane-content', class extends PaneContent {
  get config() {
    return extend(super.config, {
      template,
    });
  }

  get eventChoices() {
    const topEvents = this.state.topEvents.slice().sort((a, b) => {
      a = renameEvent(a.name).toLowerCase();
      b = renameEvent(b.name).toLowerCase();
      return a > b ? 1 : a < b ? -1 : 0;
    });
    return [ShowClause.TOP_EVENTS, ShowClause.ALL_EVENTS, ...topEvents];
  }

  get section() {
    return 'show';
  }
});
