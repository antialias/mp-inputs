import { Component } from 'panel';

import './builder-show';
import './builder-group';
import './builder-time';
import './builder-filter';

import template from './index.jade';
import './index.styl';

document.registerElement(`irb-builder`, class extends Component {
  get config() {
    return {template};
  }
});
