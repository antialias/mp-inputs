import { App } from 'panel';
import { mirrorLocationHash } from './mp-common/parent-frame';

import Panel from './models/panel';
import ListView from './views/list';
import MixView from './views/mix';
import { extend } from './util';

import './stylesheets/app.styl';

export default class PanelApp extends App {
  constructor(elID, initialState={}, attrs={}) {
    super(...arguments);

    // initialize frame communication
    this.parentFrame = attrs.parentFrame;
    mirrorLocationHash(this.parentFrame);
  }

  get ROUTES() {
    return {
      'mix(/:panelId)': this.mix,
      'mix': this.mix,
      'list': this.list,
      '': this.list,
    };
  }

  get SCREENS() {
    return {
      list: new ListView(),
      mix: new MixView(),
    };
  }

  list(state={}) {
    this.update({$screen: 'list', $fragment: 'list'});
  }

  mix(state={}, panelId=null) {
    let panel = panelId ? this.state.panels[Number(panelId)] : new Panel();

    this.update({
      $screen: 'mix',
      $fragment: `mix/${panel.id}`,
      panel,
      panels: extend(this.state.panels, {[panel.id]: panel}),
    });
  }

  updatePanel(attrs) {
    let panel = extend(this.state.panel, attrs);
    this.update({
        panel,
        panels: extend(this.state.panels, {[panel.id]: panel}),
    });
  }
}
