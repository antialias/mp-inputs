import {BuilderScreenBase} from './builder-screen-base';
import {extend} from '../../../util';
import {Clause} from '../../../models/clause';
import template from './builder-screen-datasets.jade';

document.registerElement(`builder-screen-datasets`, class extends BuilderScreenBase {
  get config() {
    return {
      template,
      helpers: extend(super.config.helpers, {
        getDatasets: () => {
          this.updateRenderedSizeOnNextFrame();
          return this.app.getDatasets().map((dataset, index) => extend(dataset, {index}));
        },
        selectDataset: datasetName => {
          this.app.updateSelectedDataset(datasetName);
          this.nextScreen(`builder-screen-sources`);
        },
        updateRenderedSizeOnNextFrame: () => this.updateRenderedSizeOnNextFrame(),
        getFilterSections: () => this.buildList(),
        clickedItem: ev => {
          const item = ev.detail.item;
          if (item.itemType === `dataset`) {
            this.helpers.selectDataset(item);
          }
          else if (item.itemType === `event`) {
            this.helpers.clickedEvent(ev);
          }
          else if (item.itemType === `property`) {
            this.helpers.clickedProperty(ev);
          }
        },
      }),
    };
  }

  buildList() {
    return [
      {
        label: `Datasets`,
        items: this.app.getDatasets().map(dataset => extend(dataset, {
          itemType: `dataset`,
          label: dataset.displayName,
          icon: `dataset`,
        })),
      },
      {
        label: `Events`,
        items: this.allEvents().map(event => extend(event, {
          itemType: `event`,
          hasPropertiesPill: true,
        })),
      },
      {
        label: `People properties`,
        items: this.allProperties(Clause.RESOURCE_TYPE_PEOPLE).map(property => extend(property, {
          itemType: `property`,
        })),
      },
    ];
  }
});
