import moment from 'moment';
import { Component } from 'panel';

import { extend } from '../../util';

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


document.registerElement(`irb-reports`, class extends Component {
  get config() {
    return {
      template,

      defaultState: {
        reportsDrawer: {
          nameFilter: ``,
          userFilter: `all`,

          sortField: `name`,
          sortOrder: `asc`,
        },
      },

      helpers: {
        changeNameFilter: ev => this.updateDrawer({nameFilter: ev.target.value}),
        changeUserFilter: ev => this.updateDrawer({userFilter: ev.detail.selected}),
        clickDelete: report => this.updateDrawer({confirmDelete: report}),
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
            const searchStr = drawer.nameFilter.toLowerCase();
            reports = reports.filter(r => r.title.toLowerCase().startsWith(searchStr));
          }
          return reports.sort((a, b) => {
            a = a[drawer.sortField];
            b = b[drawer.sortField];
            if (drawer.sortField === `modified`) {
              a = moment.utc(a);
              b = moment.utc(b);
            } else if (typeof a === `string`) {
              a = a.toLowerCase();
              b = b.toLowerCase();
            }
            let cmp = a > b ? 1 : a < b ? -1 : 0;
            return drawer.sortOrder === `desc` ? -cmp : cmp;
          });
        },
      },
    };
  }

  updateDrawer(attrs) {
    this.update({reportsDrawer: extend(this.state.reportsDrawer, attrs)});
  }
});
