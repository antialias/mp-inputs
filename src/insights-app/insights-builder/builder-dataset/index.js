import {Component} from 'panel';
import template from './index.jade';
import './index.styl';

document.registerElement(`query-builder-dataset`, class extends Component {
  get config() {
    return {
      template,
      helpers: {
        isMenuOpen: menu => !!this.app.getBuilderCurrentScreenAttr(`${menu}MenuOpen`),
        openMenu: (ev, menu) => {
          this.helpers.updateMenu(menu, true);
          ev.stopPropagation();
        },
        menuChange: (ev, menu) => // check for close
          ev.detail && ev.detail.state === `closed` && this.helpers.updateMenu(menu, false),
        updateMenu: (menu, open) => this.app.updateBuilderCurrentScreen({[`${menu}MenuOpen`]: open}),
        updateSelectedDataset: dataset => this.app.updateSelectedDataset(dataset),
      },
    };
  }
});
