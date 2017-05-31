import {BuilderScreenBase} from './builder-screen-base';
import {extend} from '../../../util';
import {Clause} from '../../../models/clause';
import template from './builder-screen-datasets.jade';

const DATASETS = [
  {displayName: `Mixpanel`, datasetName: ``, description: `Product usage, customers e.t.c`},
  {displayName: `Salesforce`, datasetName: `salesforce`, description: `Customer relations, sales e.t.c`},
];

document.registerElement(`builder-screen-datasets`, class extends BuilderScreenBase {
  get config() {
    return {
      template,
      helpers: extend(super.config.helpers, {
        getDatasets: () => {
          this.updateRenderedSizeOnNextFrame();
          let indexedDatasets = DATASETS.slice();
          return indexedDatasets.map((source, index) => extend(source, {index}));
        },
        getSelectedDataset: () => {
          return this.app.getDataset();
        },
        selectDataset: dataset => {
          this.app.updateSelectedDataset(dataset.datasetName);
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
        items: DATASETS.map(dataset => {
          return extend(dataset, {
            itemType: `dataset`,
            label: dataset.displayName,
            icon: `dashboard2`,
          });
        }),
      },
      {
        label: `Events`,
        items: this.allEvents().map(event => {
          return extend(event, {
            itemType: `event`,
            hasPropertiesPill: true,
          });
        }),
      },
      {
        label: `People properties`,
        items: this.allProperties(Clause.RESOURCE_TYPE_PEOPLE).map(property => {
          return extend(property, {
            itemType: `property`,
          });
        }),
      },
    ];
  }
});
