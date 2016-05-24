import { Component } from 'panel';

import './bar-chart';
import './line-chart';
import './table-chart';
import './chart-controls';

import template from './index.jade';
import './index.styl';

document.registerElement('irb-result', class extends Component {
  get config() {
    return {template};
  }
});
