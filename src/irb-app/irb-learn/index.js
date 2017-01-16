import { Component } from 'panel';
import 'mixpanel-common/widgets/tutorial-tooltip';

import template from './index.jade';
import './index.styl';

document.registerElement(`irb-learn`, class extends Component {
  get config() {
    return {
      template,
      helpers: {
        clickedNext: () => this.app.update({
          learnFlow: Object.assign(this.state.learnFlow, {
            modalsSeen: this.state.learnFlow.modalsSeen + 1,
          }),
        }),
        clickedFinish: () => {
          this.app.update({learnFlow: null});
          this.navigate(``);
        },
      },
    };
  }
});
