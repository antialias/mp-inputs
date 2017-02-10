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
        isAnalysisDisabled: analysis => !this.IRBResult.isAnalysisEnabled(analysis),
        isValueToggleDisabled: () => !this.IRBResult.isValueToggleEnabled(),
        menuChange: ev => ev.detail && ev.detail.state === `closed` && this.app.stopEditingExtrasMenu(),
        onClickExtrasMenu: () => this.update({isEditingExtrasMenu: !this.state.isEditingExtrasMenu}),
        onAnalysisClick: analysis => {
          const reportTrackingData = this.state.report.toTrackingData();
          this.IRBResult.updateDisplayOptions({analysis});
          this.app.stopEditingExtrasMenu();
          this.app.trackEvent(
            `Chart Options - Changed Analysis`,
            extend(reportTrackingData, {'new analysis type': analysis})
          );
        },
        onValueClick: value => {
          const reportTrackingData = this.state.report.toTrackingData();
          this.IRBResult.updateDisplayOptions({value});
          this.app.stopEditingExtrasMenu();
          this.app.trackEvent(
            `Chart Options - Changed Value Display`,
            extend(reportTrackingData, {'new analysis type': value})
          );
        },
      },
    };
  }

  get IRBResult() {
    this._IRBResult = this._IRBResult || this.findPanelParentByTagName(`irb-result`);
    return this._IRBResult;
  }
});
