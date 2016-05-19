import { Component } from 'panel';

import './builder-show';

// import TimeView from './time';
// import GroupView from './group';
// import FilterView from './filter';

import template from './index.jade';
import './index.styl';

document.registerElement('irb-builder', class extends Component {
  get config() {
    return {template};
  }
});
