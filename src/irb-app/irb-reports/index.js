import {
  defaultOrdering,
  leqToNumericOrdering,
  lexicalCompose,
  mapArguments,
} from 'mixpanel-common/util/function';
import moment from 'moment';
import { Component } from 'panel';

import { extend, stringFilterMatches } from '../../util';

import '../widgets/mp-drawer';

import template from './index.jade';

import './index.styl';

// TODO these are some updates which need to make their way into
// mixpanel-common and panel soon
// -------------------------------------------------------------------------------
const MPToggle = window[`mp-common-registered-components`][`mp-toggle`];
document.registerElement(`irb-mp-toggle`, class extends MPToggle {
  attachedCallback() {
    if (this.initialized) {
      return;
    }
    super.attachedCallback(...arguments);
  }
});
const MPTooltip = window[`mp-common-registered-components`][`mp-tooltip`];
document.registerElement(`irb-mp-tooltip`, class extends MPTooltip {
  attachedCallback() {
    if (!this.initialized) {
      super.attachedCallback(...arguments);
    } else {
      this.host = this.parentNode;
      this.host.addEventListener(`mouseenter`, this.show);
      this.host.addEventListener(`mouseleave`, this.hide);
    }
  }
});
const MPConfDel = window[`mp-common-registered-components`][`mp-confirm-delete`];
document.registerElement(`irb-mp-confirm-delete`, class extends MPConfDel {
  attachedCallback() {
    if (this.initialized) {
      return;
    }

    if (!this.elementMoved) {
      this.elementMoved = true;
      document.body.style.position = `relative`;
      document.body.appendChild(this);
    }

    if (!this.initialized) {
      super.attachedCallback(...arguments);
    }
  }
});
// -------------------------------------------------------------------------------

const LEQ_ORDER = {
  asc: leqToNumericOrdering((a, b) => a <= b),
  desc: leqToNumericOrdering((a, b) => b <= a),
};

document.registerElement(`irb-reports`, class extends Component {
  get config() {
    return {
      template,

      defaultState: {
        reportsDrawer: {
          nameFilter: ``,
          userFilter: `all`,

          sortField: `title`,
          sortOrder: `asc`,
        },
      },

      helpers: {
        changeNameFilter: ev => this.updateDrawer({nameFilter: ev.target.value}),
        changeUserFilter: userFilter => this.updateDrawer({userFilter}),
        clickDelete: (ev, report) => {
          ev.stopPropagation();
          this.updateDrawer({confirmDelete: report});
        },
        clickHeader: field => {
          const sortField = field;
          let sortOrder = this.state.reportsDrawer.sortOrder;
          if (field === this.state.reportsDrawer.sortField) {
            sortOrder = sortOrder === `asc` ? `desc` : `asc`;
          }
          this.updateDrawer({sortField, sortOrder});
        },
        clickReport: report => {
          this.helpers.close();
          this.app.chooseReport(report);
        },
        close: () => {
          this.updateDrawer({nameFilter: ``});
          this.update({reportsDrawerOpen: false});
        },
        deleteReport: report => {
          this.app.deleteReport(report);
          this.updateDrawer({confirmDelete: null});
        },
        focusSearchInput: vnode => requestAnimationFrame(
          () => vnode.elm.parentNode.querySelector(`input`).focus()
        ),
        handleConfirmChange: visibility => {
          if (visibility !== `open`) {
            this.updateDrawer({confirmDelete: null});
          }
        },
        hasWritePermissions: () => this.app.hasWritePermissions,
        reportsForDisplay: () => {
          const drawer = this.state.reportsDrawer;
          let reports = Object.values(this.state.savedReports);
          if (drawer.userFilter === `yours`) {
            const userID = String(this.app.userID);
            reports = reports.filter(bm => String(bm.userID) === userID);
          }
          if (drawer.nameFilter) {
            reports = reports
              .map(report => extend(report, {
                matches: stringFilterMatches(report.title, drawer.nameFilter),
              }))
              .filter(report => !!report.matches);
          }
          const orderFunc = LEQ_ORDER[drawer.sortOrder || `asc`];
          return reports.sort(lexicalCompose(
            // prioritize beginning match
            mapArguments(defaultOrdering, report =>
              report.matches ? -report.matches[0].length : 0
            ),

            // second: order by selected field
            mapArguments(orderFunc, report => {
              let val = report[drawer.sortField];
              if (drawer.sortField === `modified`) {
                val = moment.utc(val);
              } else if (typeof val === `string`) {
                val = val.toLowerCase();
              }
              return val;
            })
          ));
        },
      },
    };
  }

  updateDrawer(attrs) {
    this.update({reportsDrawer: extend(this.state.reportsDrawer, attrs)});
  }
});
