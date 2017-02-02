import { Component } from 'panel';

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
        close: () => this.update({reportsDrawerOpen: false}),
        reportsForDisplay: () => {
          return Object.keys(this.state.savedReports);
        },
      },
    };
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
//         bookmarksForDisplay: () => {
//           let bookmarks = this.state.bookmarks;
//           if (this.state.userFilter === 'yours') {
//             const userId = String(mp.report.globals.user_id);
//             bookmarks = bookmarks.filter(bm => String(bm.user_id) === userId);
//           }
//           if (this.state.nameFilter) {
//             const searchStr = this.state.nameFilter.toLowerCase();
//             bookmarks = bookmarks.filter(bm => bm.name.toLowerCase().startsWith(searchStr));
//           }
//           return bookmarks.sort((a, b) => {
//             a = a[this.state.sortField];
//             b = b[this.state.sortField];
//             if (this.state.sortField === 'modified') {
//               a = moment.utc(a);
//               b = moment.utc(b);
//             } else if (typeof a === 'string') {
//               a = a.toLowerCase();
//               b = b.toLowerCase();
//             }
//             let cmp = a > b ? 1 : a < b ? -1 : 0;
//             return this.state.sortOrder === 'desc' ? -cmp : cmp;
//           });
//         },
//         changeNameFilter: ev => this.update({nameFilter: ev.target.value}),
//         changeUserFilter: ev => this.update({userFilter: ev.detail.selected}),
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
//         close: () => this.close(),
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

//   get drawer() {
//     return this.el.querySelector('mp-drawer');
//   }
// });
