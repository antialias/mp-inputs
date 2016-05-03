import BaseView from '../base';

import { register } from '../../elements/charts/line';
register();

import template from '../templates/charts/line.jade';
import '../stylesheets/charts/line.styl';

export default class LineChartView extends BaseView {
  get TEMPLATE() {
    return template;
  }
}
