import { View } from 'panel';

import HeaderView from './header';

import template from '../templates/list.jade';
import '../stylesheets/list.styl';

export default class ListView extends View {
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
      clickPanelName: ev => {
        this.app.navigate(`mix/${ev.target.dataset.panelId}`);
      },
    };
  }
}
