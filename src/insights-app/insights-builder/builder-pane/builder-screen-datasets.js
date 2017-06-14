import {BuilderScreenBase} from './builder-screen-base';
import {extend} from '../../../util';
import template from './builder-screen-datasets.jade';

document.registerElement(`builder-screen-datasets`, class extends BuilderScreenBase {
  get config() {
    return {
      template,
      helpers: extend(super.config.helpers, {
        getDatasetsInfo: () => {
          this.updateRenderedSizeOnNextFrame();
          return this.app.getDatasetsInfo().map((dataset, index) => extend(dataset, {index}));
        },
        selectDataset: datasetName => {
          this.app.updateSelectedDataset(datasetName);
          this.nextScreen(`builder-screen-sources`);
        },
        getSections: () => this.buildSections(),
        updateRenderedSizeOnNextFrame: () => this.updateRenderedSizeOnNextFrame(),
      }),
    };
  }
});
