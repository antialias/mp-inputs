import { View } from 'panel';

import template from '../templates/builder/time.jade';
import '../stylesheets/builder/time.styl';

export default class TimeView extends View {
  get TEMPLATE() {
    return template;
  }

  get VIEWS() {
    return {
    };
  }

  get templateHandlers() {
    return {
    };
  }

  get templateHelpers() {
    return {
      formatText: () => {
        if (this.app.state.timeSection.length === 1) {
          const { unit, start, end } = this.app.state.timeSection[0];

          if (start < 0 && end === null) {
            return `last ${Math.abs(start)} ${unit}s`;
          } else {
            throw new Error('Date range formatting not yet implemented.');
          }
        } else {
          return '';
        }
      }
    }
  }
}
