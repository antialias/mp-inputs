import BaseView from '../base';

import template from '../templates/charts/table.jade';
import '../stylesheets/charts/table.styl';

export default class TableChartView extends BaseView {
  get TEMPLATE() {
    return template;
  }
}
