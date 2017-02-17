import { Component } from 'panel';

import './builder-time-edit-control';
import './builder-screen-time';
import './builder-screen-time-custom';

import template from './index.jade';
import './index.styl';

document.registerElement(`query-builder-time`, class extends Component {
  get config() {
    return {
      template,
      helpers: {
        showUpsellModal: () => this.state.upsellModal === `timeClause`,
        closeUpsellModal: ev => this.app.maybeCloseUpsellModal(ev, `timeClause`),
        alignCustomPaneRight: () => !!this.app.getBuilderCurrentScreenAttr(`alignTimeCustomPaneRight`),
      },
    };
  }
});
