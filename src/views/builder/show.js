import { View } from 'panel';

import PaneView from './pane';

import { capitalize } from '../../util';
import { RESOURCE_VALUE_ALL } from '../../constants';

import template from '../templates/builder/show.jade';
import '../stylesheets/builder/show.styl';

export default class ShowView extends View {
  get TEMPLATE() {
    return template;
  }

  get VIEWS() {
    return {
      addPane: new PaneView(this),
    };
  }

  get templateHandlers() {
    return {
    };
  }

  get templateHelpers() {
    return {
      formatMath: comparison => capitalize(comparison.math),
      formatValue: comparison => {
        if (comparison.value === RESOURCE_VALUE_ALL) {
            return `All ${capitalize(comparison.type)}`;
        } else {
            return comparison.value;
        }
      },
    };
  }
}
