import Framesg from 'framesg';

import PanelApp from './app';
import Panel from './models/panel';

import './stylesheets/index.styl';

function initialize(attrs={}) {
    let panel = new Panel();

    const initialState = {
      $screen: 'list',
      panel,
      panels: {[panel.id]: panel},
    };

    return new PanelApp('app', initialState, attrs);
}

if (window.parent === window) { // the app is running outside of an iframe
    initialize().update();
} else { // the app is running inside an iframe (within Mixpanel Platform)
    const parentFrame = new Framesg(window.parent, 'panel-foundation', {
      startApp: parentData => {
        panelApp = initialize({parentFrame});
        window.history.replaceState(null, null, parentData.hash.replace(/^#*/, '#'));
        panelApp.update();
      },
    });
}
