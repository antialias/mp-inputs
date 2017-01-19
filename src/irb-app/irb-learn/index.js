import { Component } from 'panel';
import 'mixpanel-common/widgets/tutorial-tooltip';

import template from './index.jade';
import './index.styl';

document.registerElement(`irb-learn`, class extends Component {
  get config() {
    return {
      template,
      helpers: {
        clickedNext: () => this.update({
          learnModalStepIndex: (this.state.learnModalStepIndex || 0) + 1,
        }),
        clickedFinish: () => {
          this.update({learnActive: false, learnModalStepIndex: null});
          this.navigate(``);
        },
      },
    };
  }
});
