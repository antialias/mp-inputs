// import { Clause, GroupClause, ShowClause } from '../../../../models/clause';
import { BuilderScreenBase } from '../builder-pane/builder-screen-base';

import {
  extend,
} from '../../../util';

import template from './builder-screen-people.jade';

document.registerElement(`builder-screen-people`, class extends BuilderScreenBase {
  get config() {
    return {
      template,
      helpers: extend(super.config.helpers, {

      }),
    };
  }
});
