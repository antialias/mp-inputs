import { Component } from 'panel';

import './builder-show';
import './builder-group';
import './builder-time';
import './builder-filter';

import template from './index.jade';
import './index.styl';

document.registerElement(`old-irb-builder`, class extends Component {
  get config() {
    return {
      helpers: {
        clickSetupMixpanel: () => this.app.navigateToSetup(),
        reset: () => {
          const reportTrackingData = this.state.report.toTrackingData();
          this.app.navigate(``, this.app.resetQuery());
          this.app.trackEvent(`Reset Report`, reportTrackingData);
        },
      },
      template,
    };
  }
});
