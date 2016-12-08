import { Component } from 'panel';

import template from './index.jade';
import './index.styl';

import './builder-sections';
import './builder-show';

document.registerElement(`new-irb-builder`, class extends Component {
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