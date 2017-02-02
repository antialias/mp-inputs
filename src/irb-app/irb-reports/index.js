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
        close: () => {
          this.updateDrawer({nameFilter: ``});
          this.update({reportsDrawerOpen: false});
        },
        modifiedStr: () => `blah`,
        reportsForDisplay: () => {
          const drawer = this.state.reportsDrawer;
          let reports = Object.values(this.state.savedReports);
          // if (drawer.userFilter === `yours`) {
          //   const userId = String(mp.report.globals.user_id);
          //   reports = reports.filter(bm => String(bm.user_id) === userId);
          // }
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
//         clickBookmark: bookmark => {
//           this.dispatchEvent(new CustomEvent('change', {detail: {
//             action: 'choose',
//             bookmarkId: bookmark.id,
//           }}));
//           this.close();
//         },
//         clickDelete: bookmark => {
//           this.dispatchEvent(new CustomEvent('change', {detail: {
//             action: 'delete',
//             bookmarkId: bookmark.id,
//           }}));
//         },
//         clickHeader: field => {
//           const sortField = field;
//           let sortOrder = this.state.sortOrder;
//           if (field === this.state.sortField) {
//             sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
//           }
//           this.update({sortField, sortOrder});
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
