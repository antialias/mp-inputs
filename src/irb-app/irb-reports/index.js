import moment from 'moment';
import { Component } from 'panel';

import { extend } from '../../util';

import '../widgets/mp-drawer';

import template from './index.jade';

import './index.styl';

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


// import moment from 'moment';
// import { Component } from 'panel';

// import './mp-drawer';

// import css from './index.styl';
// import template from './index.jade';

// document.registerElement('bookmark-drawer', class extends Component {
//   get config() {
//     return {
//       css,
//       template,
//       useShadowDom: true,

//       defaultState: {
//         bookmarks: [],
//         nameFilter: '',
//         userFilter: 'all',

//         sortField: 'name',
//         sortOrder: 'asc',
//       },

//       helpers: {
//         clickDelete: bookmark => {
//           this.dispatchEvent(new CustomEvent('change', {detail: {
//             action: 'delete',
//             bookmarkId: bookmark.id,
//           }}));
//         },
//         drawerChange: ev => {
//           if (ev.detail) {
//             this.setAttribute('open', ev.detail.open);
//             this.update({nameFilter: ''});
//           }
//         },
//         isOpen: () => this.isAttributeEnabled('open'),
//         modifiedStr: bookmark => moment.utc(bookmark.modified).local().format('MMM D, YYYY'),
//       },
//     };
//   }

//   close() {
//     this.drawer.close();
//     this.update({nameFilter: ''});
//   }
