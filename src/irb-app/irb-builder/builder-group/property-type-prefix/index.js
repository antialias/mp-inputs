import { Component } from 'panel';

import { getIconForPropertyType } from '../../../../util';
import { GroupClause } from '../../../../models/clause';

import template from './index.jade';
import './index.styl';

document.registerElement(`property-type-prefix`, class extends Component {
  get config() {
    return {
      template,
      helpers: {
        attrsForTypecast: () => ({
          'clause-index': this.clauseIndex,
          'section': GroupClause.TYPE,
        }),
        clickedIcon: ev => {
          ev.stopPropagation();
          if (this.state.builderPane.isEditingTypecast) {
            this.app.stopBuildingQuery();
            this.app.updateBuilder({isEditingTypecast: false});
          } else {
            this.app.resetBuilder();
            this.app.stopEditingClause();
            this.app.startEditingClause(GroupClause.TYPE, this.clauseIndex);
            this.app.updateBuilder({isEditingTypecast: true});
          }
        },
        typeIcon: () => getIconForPropertyType(this.getAttribute(`property-type`)),
      },
    };
  }

  get clauseIndex() {
    return Number(this.getAttribute(`clause-index`));
  }
});
