import { ShowClause } from '../../../models/clause';
import { PaneContent } from '../../pane';
import { extend, renameEvent, renameProperty, sorted } from '../../../util';

import template from './show-pane-content.jade';

document.registerElement('show-pane-content', class extends PaneContent {
  get config() {
    return extend(super.config, {
      template,
      helpers: extend(super.config.helpers, {
        onArrowClick: (ev, value) => {
          ev.stopPropagation();
          this.app.updateStageClause({value});
          this.app.startAddingClause('group');
          window.requestAnimationFrame(() =>
            this.app.updateStageClause({paneIndex: 1})
          );
        },
        onPropertyArrowClick: (ev, property) => {
          ev.stopPropagation();
          this.app.updateStageClause({value: property});
          this.app.startAddingClause('show');
          window.requestAnimationFrame(() =>
            this.app.updateStageClause({paneIndex: 1})
          );
        },
        showResource: (resourceType, selectedResourceType) => {
          return selectedResourceType === 'all' || selectedResourceType === resourceType;
        },
        selectProperty: property => {
          // commit property selection with "All Events"
          this.app.updateStageClause({value: property});
          this.app.startAddingClause('show');
          this.config.helpers.updateStageClause({value: ShowClause.ALL_EVENTS}, true);
        },
      }),
    });
  }

  get constants() {
    return extend(super.constants, {
      mathChoices: ShowClause.MATH_TYPES,
    });
  }

  get eventChoices() {
    const topEvents = this.state.topEvents.slice().sort((a, b) => {
      a = renameEvent(a.name).toLowerCase();
      b = renameEvent(b.name).toLowerCase();
      return a > b ? 1 : a < b ? -1 : 0;
    });
    return [ShowClause.TOP_EVENTS, ShowClause.ALL_EVENTS, ...topEvents];
  }

  get eventPropertyChoices() {
    return this._propsForDisplay(this.state.topEventProperties);
  }

  get peoplePropertyChoices() {
    return this._propsForDisplay(this.state.topPeopleProperties);
  }

  get section() {
    return 'show';
  }

  get resourceTypeChoices() {
    return ShowClause.RESOURCE_TYPES;
  }

  _propsForDisplay(props) {
    return sorted(props.filter(prop => prop.type === 'number'), {
      transform: prop => renameProperty(prop.name).toLowerCase(),
    });
  }
});
