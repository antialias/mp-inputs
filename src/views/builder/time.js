import BaseView from '../base';
import { EditControlView } from './control';
import PaneView from './pane';
import PaneContentView from './pane-content';
import { extend } from '../../util';
import '../../elements/date-picker';

import { TimeClause } from '../../models/clause';

import template from '../templates/builder/time.jade';
import timePaneContentTemplate from '../templates/builder/time-pane-content.jade';

import '../stylesheets/builder/time.styl';

class TimePaneContentView extends PaneContentView {
  get section() {
    return 'time';
  }

  get TEMPLATE() {
    return timePaneContentTemplate;
  }

  get templateConstants() {
    return extend(super.templateConstants, {
      rangeChoices: TimeClause.RANGE_CHOICES,
      customRange: TimeClause.RANGES.CUSTOM,
    });
  }

  get templateHelpers() {
    return extend(super.templateHelpers, {
      updateStageClause: clauseData => {
        this.app.updateStageClause(clauseData);
        this.app.commitStageClause();
      },
    });
  }
}

class TimePaneView extends PaneView {
  get section() {
    return 'time';
  }

  get templateConstants() {
    return extend(super.templateConstants, {
      header: 'Time',
      search: false,
    });
  }

  get VIEWS() {
    return {
      content: new TimePaneContentView(this),
    };
  }
}

class TimeEditControlView extends EditControlView {
  get section() {
    return 'time';
  }

  get templateConstants() {
    return extend(super.templateConstants, {
      showRemove: false,
    });
  }

  get VIEWS() {
    return {
      pane: new TimePaneView(this),
    };
  }

  get templateHelpers() {
    return extend(super.templateHelpers, {
      getLabel: () => {
        const clause = this.app.state.sections.time.clauses[0];
        const range = clause.range;

        if (range) {
          return range;
        } else {
          throw new Error('Custom ranges not implemented yet');
        }
      },
    });
  }
}

export default class TimeView extends BaseView {
  get TEMPLATE() {
    return template;
  }

  get VIEWS() {
    return {
      editControl: new TimeEditControlView(this),
    };
  }
}
