import { Component } from 'panel';

import './builder-show';
import './builder-group';

// import TimeView from './time';
// import FilterView from './filter';

import template from './index.jade';
import './index.styl';

document.registerElement('irb-builder', class extends Component {
  get config() {
    return {template};
  }
});
