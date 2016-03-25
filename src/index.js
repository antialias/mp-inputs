import Framesg from 'framesg';

import PanelApp from './app';
import Panel from './models/panel';
import { mixpanel } from './tracking';

import './stylesheets/index.styl';

const parentFrame = new Framesg(window.parent, 'panel-foundation', {
  startApp: parentData => {
    let panel = new Panel();

    const initialState = {
      $screen: 'list',
      panel,
      panels: {[panel.id]: panel},
    };

    const panelApp = new PanelApp('app', initialState, {parentFrame});
    window.history.replaceState(null, null, parentData.hash.replace(/^#*/, '#'));
    panelApp.update();
  },
});
