import { Component } from 'panel';
import 'mixpanel-common/widgets/tutorial-tooltip';

import template from './index.jade';
import './index.styl';

// TODO these are some updates which need to make their way into
// mixpanel-common and panel soon
// -------------------------------------------------------------------------------
const MPButtonBar = window[`mp-common-registered-components`][`mp-button-bar`];
document.registerElement(`irb-mp-button-bar`, class extends MPButtonBar {
  attachedCallback() {
    if (!this.initialized) {
      super.attachedCallback(...arguments);
    }
  }
});

const MPModal = window[`mp-common-registered-components`][`mp-modal`];
document.registerElement(`irb-mp-modal`, class extends MPModal {
  attachedCallback() {
    if (this.initialized) {
      return;
    }

    if (!this.elementMoved) {
      this.elementMoved = true;
      document.body.style.position = `relative`;
      document.body.appendChild(this);
    }

    if (!this.initialized) {
      super.attachedCallback(...arguments);
    }
  }
});
// -------------------------------------------------------------------------------

document.registerElement(`irb-learn`, class extends Component {
  get config() {
    return {
      template,
      helpers: {
        clickedModalButton: step => {
          if (step === `conclusion`) {
            this.app.trackEvent(`[Onboarding] Click Close`);
            this.app.finishLearn({track: false});
          } else {
            this.app.trackEvent(`[Onboarding] Click Intro`);
            this.update({
              learnModalStepIndex: (this.state.learnModalStepIndex || 0) + 1,
            });
            this.app.transitionLearn();
          }
        },
        clickedHelp: () => this.app.trackEvent(`[Onboarding] Click Information`),
      },
    };
  }
});
