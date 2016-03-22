import { View } from 'panel';

import HeaderView from './header';

import template from '../templates/mix.jade';
import '../stylesheets/mix.styl';

import { register as registerPanelNameInput } from '../elements/panel-name-input';
registerPanelNameInput();

export default class MixView extends View {
  get TEMPLATE() {
    return template;
  }

  get VIEWS() {
    return {
      header: new HeaderView(this),
    };
  }

  get templateHandlers() {
    return {
      updatePanelName: ev => this.app.updatePanel({name: ev.target.value}),
    };
  }
}
