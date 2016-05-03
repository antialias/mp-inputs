import BaseView from '../base';

import template from '../templates/charts/bar.jade';
import '../stylesheets/charts/bar.styl';

export default class BarChartView extends BaseView {
  get TEMPLATE() {
    return template;
  }
}
