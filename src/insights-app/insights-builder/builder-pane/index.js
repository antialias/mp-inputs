/* global requestAnimationFrame */

import {Component} from 'panel';

import './builder-screen-contextual';
import './builder-screen-sources';
import './builder-screen-datasets';

import template from './index.jade';

import './index.styl';

document.registerElement(`builder-pane`, class extends Component {
  get config() {
    return {
      template,
      helpers: {
        getSizeStyle: () => this.state.builderPane && this.state.builderPane.sizeStyle || this.app.defaultBuilderState.sizeStyle,
        screenAttrs: screenIdx => {
          const attrs = {
            'screen-index': screenIdx,
            'selected': this.getAttribute(`selected`),
          };

          if (this.getAttribute(`source`)) {
            attrs.source = this.getAttribute(`source`);
          }

          return attrs;
        },
      },
    };
  }
});
