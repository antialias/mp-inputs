import { Component } from 'panel';

import template from './index.jade';
import './index.styl';

document.registerElement(`irb-learn`, class extends Component {
  get config() {
    return {
      template,
      helpers: {
        clickedNext: () => this.app.update({
          learnFlow: Object.assign(this.state.learnFlow, {
            stepIndex: this.state.learnFlow.stepIndex + 1,
          }),
        }),
      },
    };
  }
});
