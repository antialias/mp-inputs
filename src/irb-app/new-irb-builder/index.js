import { Component } from 'panel';

import { AddControl } from './controls';

import template from './index.jade';
import './index.styl';

import './builder-pane';
import './builder-show';
import './builder-group';

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

document.registerElement(`query-builder-add-contextual`, class extends AddControl {
  get elementClasses() {
    return [`contextual-menu`];
  }

  openPane() {
    this.app.startBuilderOnScreen(`builder-screen-contextual`);
  }

  isPaneOpen() {
    return this.state.builderPane.screens.length && this.state.builderPane.isContextualMenuOpen;
  }
});
