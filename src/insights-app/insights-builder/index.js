import {Component} from 'panel';

import template from './index.jade';
import './index.styl';

import './builder-contextual-add-control';
import './builder-filter';
import './builder-group';
import './builder-pane';
import './builder-show';
import './builder-time';
import './typecast-pane';

document.registerElement(`insights-builder`, class extends Component {
  get config() {
    return {
      template,
      helpers: {
        clickSetupMixpanel: () => this.app.navigateToSetup(),
        reset: () => {
          const reportTrackingData = this.state.report.toTrackingData();
          this.app.navigate(``, this.app.resetQuery());
          this.app.trackEvent(`Reset Report`, reportTrackingData);
        },
        shouldShowTimeBuilder: () => !this.state.report.sections.show.isPeopleOnlyQuery(),
        isContextualPaneOpen: () => this.app.isContextualPaneOpen(),
      },
    };
  }
});
