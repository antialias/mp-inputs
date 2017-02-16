import { Component } from 'panel';
import 'mixpanel-common/widgets/tutorial-tooltip';

import template from './index.jade';
import './index.styl';

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
