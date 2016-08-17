import { PaneContent } from '../../pane';
import { extend } from '../../../util';

import template from './event-pane-content.jade';

document.registerElement('event-pane-content', class extends PaneContent {
  get config() {
    return extend(super.config, {
      template,
    });
  }

  get section() {
    return 'show';
  }
});
