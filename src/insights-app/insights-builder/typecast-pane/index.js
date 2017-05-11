import {Component} from 'panel';

import {GroupClause} from '../../../models/clause';
import {getIconForPropertyType} from '../../../util';

import template from './index.jade';
import './index.styl';

const TYPE_FORMAT_MAP = {
  boolean: `true / false`,
  datetime: `date`,
  list: `list`,
  number: `number`,
  string: `string`,
};

document.registerElement(`typecast-pane`, class extends Component {
  get config() {
    return {
      helpers: {
        availableTypes: () => {
          const availableTypes = Array.from(new Set(GroupClause.PROPERTY_TYPECASTS.concat(this.getClausePropertyType())));
          return availableTypes.map(type => {
            return {
              icon: getIconForPropertyType(type),
              label: TYPE_FORMAT_MAP[type],
              type,
            };
          });
        },
        clickedType: ev => {
          const item = ev.detail.item;
          const typeCast = this.getClausePropertyType() === item.type ? null : item.type;
          this.app.updateStageClause({typeCast, unit: null});
          this.app.commitStageClause();
          this.app.updateBuilder({isEditingTypecast: false});
        },
        isPaneOpen: () => this.isPaneOpen(),
        menuChange: ev => {
          if (ev.detail && ev.detail.state === `closed`) {
            this.app.updateBuilder({isEditingTypecast: false});
            if (this.app.isEditingClause(this.section, this.clauseIndex)) {
              this.app.stopEditingClause();
            }
          }
        },
      },
      template,
    };
  }

  get clauseIndex() {
    return Number(this.getAttribute(`clause-index`));
  }

  get section() {
    return this.getAttribute(`section`);
  }

  isPaneOpen() {
    return this.state.builderPane.isEditingTypecast && this.app.isEditingClause(this.section, this.clauseIndex);
  }

  getClausePropertyType() {
    const clause = this.state.report.sections.getClause(this.section, this.clauseIndex);
    return clause && clause.propertyType;
  }
});
