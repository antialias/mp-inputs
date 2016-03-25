import 'babel-polyfill';
import Framesg from 'framesg';

import PanelApp from './app';
import Panel from './models/panel';
import { mixpanel } from './tracking';

import './stylesheets/index.styl';

const IS_WITHIN_MP_PLATFORM_IFRAME = window.parent !== window && window.parent.mixpanel;

function initialize(attrs={}) {
  let panel = new Panel();

  const initialState = {
    $screen: 'list',
    panel,
    panels: {[panel.id]: panel},
  };

  return new PanelApp('app', initialState, attrs);
}

if (IS_WITHIN_MP_PLATFORM_IFRAME) {
  const parentFrame = new Framesg(window.parent, 'panel-foundation', {
    startApp: parentData => {
      panelApp = initialize({parentFrame});
      window.history.replaceState(null, null, parentData.hash.replace(/^#*/, '#'));
      panelApp.update();
    },
  });
} else {
  initialize().update();
}
