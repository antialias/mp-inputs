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
            this.app.finishLearn();
          } else {
            this.update({
              learnModalStepIndex: (this.state.learnModalStepIndex || 0) + 1,
            });
            this.app.transitionLearn();
          }
        },
      },
    };
  }
});
