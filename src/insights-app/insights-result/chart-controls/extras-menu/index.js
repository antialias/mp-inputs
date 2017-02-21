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
        isAnalysisDisabled: analysis => !this.InsightsResult.isAnalysisEnabled(analysis),
        isValueToggleDisabled: () => !this.InsightsResult.isValueToggleEnabled(),
        menuChange: ev => ev.detail && ev.detail.state === `closed` && this.app.stopEditingExtrasMenu(),
        onClickExtrasMenu: () => this.update({isEditingExtrasMenu: !this.state.isEditingExtrasMenu}),
        onAnalysisClick: analysis => {
          const reportTrackingData = this.state.report.toTrackingData();
          this.InsightsResult.updateDisplayOptions({analysis});
          this.app.stopEditingExtrasMenu();
          this.app.trackEvent(
            `Chart Options - Changed Analysis`,
            extend(reportTrackingData, {'new analysis type': analysis})
          );
        },
        onValueClick: value => {
          const reportTrackingData = this.state.report.toTrackingData();
          this.InsightsResult.updateDisplayOptions({value});
          this.app.stopEditingExtrasMenu();
          this.app.trackEvent(
            `Chart Options - Changed Value Display`,
            extend(reportTrackingData, {'new analysis type': value})
          );
        },
      },
    };
  }

  get InsightsResult() {
    this._InsightsResult = this._InsightsResult || this.findPanelParentByTagName(`insights-result`);
    return this._InsightsResult;
  }
});
