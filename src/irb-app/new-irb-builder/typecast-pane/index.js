import { Component } from 'panel';

import { GroupClause } from '../../../models/clause';
import { getIconForPropertyType } from '../../../util';

import template from './index.jade';
import './index.styl';

const TYPE_FORMAT_MAP = {
  boolean: `true / false`,
  datetime: `date`,
  list: `list`,
  number: `number`,
  string: `text`,
};

document.registerElement(`typecast-pane`, class extends Component {
  get config() {
    return {
      helpers: {
        avaliableTypes: () => {
          const avaliableTypes = Array.from(new Set(GroupClause.PROPERTY_TYPECASTS.concat(this.getClausePropertyType())));
          return avaliableTypes.map(type => ({
            icon: getIconForPropertyType(type),
            name: TYPE_FORMAT_MAP[type],
            type,
          }));
        },
        clickedType: (ev, item) => {
          ev.stopPropagation();
          const typeCast = this.getClausePropertyType() === item.type ? null : item.type;
          this.app.updateStageClause({typeCast});
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
