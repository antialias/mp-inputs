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
    });
  }
});
