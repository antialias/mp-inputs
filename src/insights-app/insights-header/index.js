import {Component} from 'panel';


import {downloadLocalCSVData, renameEvent, renameProperty} from '../../util';
import {dataToCSV} from '../../util/csv';

import './insights-title-input';

import template from './index.jade';
import './index.styl';

document.registerElement(`insights-header`, class extends Component {
  get config() {
    return {
      helpers: {
        showAddToDash: () => this.app.hasWritePermissions,
        addToDashEnabled: () => !this.app.standalone,
        dashboardAttrs: () => {
          const existingBookmark = this.app.getBookmark(this.state.report);
          const attrs = {
            'access-token': this.app.accessToken,
            'all-tags': JSON.stringify(this.app.dashboardTags),
            'mixpanel-host': this.app.apiHost,
            'over-free-limit': !this.state.canAddBookmark,
            'project-id': this.app.projectID,
            'report-name': this.state.report.title,
            'report-type': `insights`,
            'show-tutorial-tooltip': this.app.getFlag(`VIEWED_REPORT_COUNT`) >= 30 && !this.app.getFlag(`DASHBOARD_ADDED_REPORT_OR_SEEN_TOOLTIP`),
            'tooltip-placement': `top`,
            'user-id': this.app.userID,
          };
          if (existingBookmark && !this.state.unsavedChanges) {
            attrs.bookmark = JSON.stringify(existingBookmark);
          } else {
            if (this.state.report.displayOptions.chartType === `table`) {
              attrs[`disabled`] = true;
              attrs[`not-implemented`] = true;
              attrs[`not-implemented-text`] = `Table view is not currently supported in web dashboards. Please choose a different visualization and try again`;
            }

            const sections = this.state.report.sections;
            if (sections && sections.group && sections.group.clauses && sections.group.clauses.length > 2) {
              attrs[`disabled`] = true;
              attrs[`not-implemented`] = true;
              attrs[`not-implemented-text`] = `More than two groupings are not currently supported in web dashboards. Please remove some groups and try again`;
            }
          }

          return attrs;
        },

        dashboardReportAdded: () => {
          this.app.mpContext.setFlag(`DASHBOARD_ADDED_REPORT_OR_SEEN_TOOLTIP`);
        },

        dashboardReportTagsSaved: e => {
          // update the in-memory bookmark
          this.app.getBookmark(this.state.report).tags = e.detail.selectedTags;
          this.update();
        },

        addToDashTutorialTooltipClosed: () => {
          this.app.mpContext.setFlag(`DASHBOARD_ADDED_REPORT_OR_SEEN_TOOLTIP`);
        },

        // override for the add-to-dash method "saveBookmark"
        saveBookmark: () => {
          if (!this.state.report.title) {
            // generate a title
            const firstClause = this.state.report.sections.show.clauses[0];
            const val = firstClause.value;
            const isEventQuery = val.resourceType === `events`;
            const name = isEventQuery ? renameEvent(val.name) : renameProperty(val.name);
            this.state.report.title = name;
          }
          // saveReport will also update the in-memory bookmark
          return this.app.saveReport().then(() =>  this.app.getBookmark(this.state.report));
        },

        isExistingReport: () => !this.state.report.isNew(),

        refresh: () => {
          if (this.state.projectHasEvents) {
            const reportTrackingData = this.state.report.toTrackingData();
            this.app.query({useCache: false});
            this.app.trackEvent(`Refresh Report`, reportTrackingData);
          }
        },

        titleInputEnabled: () => this.app.hasWritePermissions && (this.state.projectHasEvents || this.state.projectHasPeople),

        updateTitle: ev => {
          if (ev.detail) {
            const newReportData = {title: ev.detail.value};
            if (ev.detail.save) {
              this.resetSaveFeedback();
              clearTimeout(this.saveFeedbackTimeout);
              this.app.saveReport({saveAsNew: ev.detail.saveAsNew, newReportData})
                .then(() => this.update({saved: true}))
                .catch(() => this.update({saveFailed: true}))
                // TODO extract and share this duration, also used in add-to-dash
                .then(() => this.saveFeedbackTimeout = setTimeout(() => this.resetSaveFeedback(), 3300));
            } else {
              this.app.updateReport(newReportData);
            }
          }
        },

        clickExportCSV: () => {
          if (this.app.getFeatureGateValue(`can_export_csv`)) {
            if (!this.state.resultLoading && this.state.projectHasEvents) {
              const report = this.state.report;
              downloadLocalCSVData(`${report.title || `Untitled Report`}.csv`, dataToCSV(this.state.result, {
                timeUnit: report.timeUnit(),
              }));
            }
          } else {
            this.app.openUpsellModal(`exportCSV`);
          }
        },
        clickReportList: () => this.app.openReportList(),
        showSaveReportUpsell: () => this.state.upsellModal === `saveReport`,
        showExportCSVUpsell: () => this.state.upsellModal === `exportCSV`,
        showExportCSVIcon: () => this.app.getFeatureGateValue(`can_export_csv`) === false,
        closeUpsell: (ev, name) => this.app.maybeCloseUpsellModal(ev, name),
      },
      template,
    };
  }

  resetSaveFeedback() {
    this.update({saved: false, saveFailed: false});
  }
});
