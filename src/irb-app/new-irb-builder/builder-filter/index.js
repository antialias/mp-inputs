// "Filter" controls

import { Component } from 'panel';

// import { EditControl } from '../controls';

import './builder-filter-add-control';
import './builder-screen-filter-properties-list';

import template from './index.jade';

import './index.styl';

document.registerElement(`query-builder-filter`, class extends Component {
  get config() {
    return {
      template,
      helpers: {
      },
    };
  }
});


// TODO
// document.registerElement(`builder-filter-edit-control`, class extends EditControl {
//   get section() {
//     return FilterClause.TYPE;
//   }

//   get label() {
//     return `TODO`;
//   }

//   openPane() {
//     super.openPane();
//     this.app.startBuilderOnScreen(`builder-screen-filter-properties-list`);
//   }
// });

// document.registerElement(`builder-screen-filter-property`, class extends BuilderScreenBase {
// });
