import { View } from 'panel';

import HeaderView from './header';
import BuilderView from './builder';
import ResultView from './result';

import template from '../templates/irb.jade';
import '../stylesheets/irb.styl';

export default class IrbView extends View {
  get TEMPLATE() {
    return template;
  }

  get VIEWS() {
    return {
      header: new HeaderView(this),
      builder: new BuilderView(this),
      result: new ResultView(this),
    };
  }
}
