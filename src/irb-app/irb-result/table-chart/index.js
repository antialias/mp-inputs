import { Component } from 'panel';

import template from './index.jade';
import './index.styl';

document.registerElement('table-chart', class extends Component {
  get config() {
    return {template};
  }
});
