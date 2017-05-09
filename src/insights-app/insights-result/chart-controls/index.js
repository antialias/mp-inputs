import {Component} from 'panel';

import {extend} from '../../../util';

import template from './index.jade';
import './index.styl';

import './chart-toggle';
import './extras-menu';

document.registerElement(`chart-controls`, class extends Component {
  get config() {
    return extend(super.config, {
      template,

      // TODO DEBUG CODE - remove when we switch fully to new Insights API
      helpers: {
        toggleResult: () => this.app.toggleResult(),
      },
      // END DEBUG CODE
    });
  }
});
