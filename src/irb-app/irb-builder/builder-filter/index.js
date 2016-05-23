// Controls for filtering based on properties

import { Component } from 'panel';

// import { extend, renameProperty } from '../../../util';

// import { AddControl, EditControl } from '../controls';
// import { Clause, ShowClause } from '../../../models/clause';
// import { Pane, PaneContent } from '../../pane';

import template from './index.jade';
// import propertyPaneContentTemplate from '../controls/property-pane-content.jade';
import './index.styl';

document.registerElement('builder-filter', class extends Component {
  get config() {
    return {
      template,

      helpers: {
        isAddingClause: () => this.app.isAddingClause('filter'),
      },
    };
  }
});

// // controls
// document.registerElement('filter-add-control', class extends AddControl {
//   get constants() {
//     return extend(super.constants, {
//       label: 'Group',
//     });
//   }

//   get section() {
//     return 'filter';
//   }
// });

// document.registerElement('filter-edit-control', class extends EditControl {
//   get config() {
//     return extend(super.config, {
//       helpers: extend(super.config.helpers, {
//         getLabel: () =>
//           renameProperty(this.state.sections.getClause('filter', this.clauseIndex).value),
//       }),
//     });
//   }

//   get section() {
//     return 'filter';
//   }
// });

// // dropdown content
// document.registerElement('filter-pane', class extends Pane {
//   get constants() {
//     return extend(super.constants, {
//       hasContent: true,
//       header: 'Properties',
//     });
//   }

//   get section() {
//     return 'filter';
//   }
// });

// document.registerElement('filter-pane-content', class extends PaneContent {
//   get config() {
//     return extend(super.config, {
//       template: propertyPaneContentTemplate,

//       helpers: extend(super.config.helpers, {
//         selectProperty: (property, closePane) =>
//           this.config.helpers.updateStageClause({value: property.name}, closePane),
//       }),
//     });
//   }

//   get constants() {
//     return extend(super.constants, {
//       resourceTypeChoices: Clause.RESOURCE_TYPES,
//     });
//   }

//   get section() {
//     return 'filter';
//   }
// });
