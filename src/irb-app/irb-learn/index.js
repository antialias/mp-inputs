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
          learnFinish: this.finish.bind(this), // allow tooltips to finish learn flow
        }),
        clickedFinish: () => this.finish(),
      },
    };
  }

  finish() {
    this.update({learnActive: false, learnModalStepIndex: null, learnFinish: null});
    this.navigate(``);
  }
});
