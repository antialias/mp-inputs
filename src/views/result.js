import BaseView from './base';
import { register as registerChart } from '../elements/chart';

import template from './templates/result.jade';
import './stylesheets/result.styl';

registerChart();

export default class ResultView extends BaseView {
  get TEMPLATE() {
    return template;
  }
}
