import { Component } from 'panel';

import { extend } from '../../../../util';

import template from './index.jade';
import './index.styl';

const ANALYSIS_LIST = [`linear`, `rolling`, `logarithmic`, `cumulative`];
const VALUE_LIST = [`absolute`, `relative`];

document.registerElement(`extras-menu`, class extends Component {
  get config() {
    return {
      template,
      helpers: {
        analysisChoices: () => ANALYSIS_LIST,
        getButtonStyle: () => {
          const style = {};
          const stickyHeader = this.state.stickyHeader;
          if (stickyHeader.isSticky) {
            // TODO: load from json to protect width
            const extrasWidth = 30;
            style.left = `${stickyHeader.chartWidth + stickyHeader.chartOffsetLeft - extrasWidth - stickyHeader.windowScrollLeft}px`;
          }
          return style;
        },
        valueChoices: () => VALUE_LIST,
        isAnalysisDisabled: analysis => !this.insightsResult.isAnalysisEnabled(analysis),
        isValueToggleDisabled: () => !this.insightsResult.isValueToggleEnabled(),
        menuChange: ev => ev.detail && ev.detail.state === `closed` && this.app.stopEditingExtrasMenu(),
        onClickExtrasMenu: () => this.update({isEditingExtrasMenu: !this.state.isEditingExtrasMenu}),
        onAnalysisClick: analysis => {
          const reportTrackingData = this.state.report.toTrackingData();
          this.insightsResult.updateDisplayOptions({analysis});
          this.app.stopEditingExtrasMenu();
          this.app.trackEvent(
            `Chart Options - Changed Analysis`,
            extend(reportTrackingData, {'new analysis type': analysis})
          );
        },
        onValueClick: value => {
          const reportTrackingData = this.state.report.toTrackingData();
          this.insightsResult.updateDisplayOptions({value});
          this.app.stopEditingExtrasMenu();
          this.app.trackEvent(
            `Chart Options - Changed Value Display`,
            extend(reportTrackingData, {'new analysis type': value})
          );
        },
      },
    };
  }

  get insightsResult() {
    this._insightsResult = this._insightsResult || this.findPanelParentByTagName(`insights-result`);
    return this._insightsResult;
  }
});
