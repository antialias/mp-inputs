/* global afterEach, beforeEach, describe, it */

import {currentScreenAsync, setupAppAsync} from '../../../insights-util';
import {
  elementFnIsVisibleAsync,
  nextAnimationFrame,
  queryShadowSelectors,
  queryShadowSelectorsAll,
  sendInput
} from '../../../util';

describe(`filter menu`, function() {
  beforeEach(async function() {
    const app = await setupAppAsync({
      apiOverrides: (url, params) => {
        if (url.indexOf(`/api/2.0/engage/properties`) !== -1) {
          return {
            'results': {
              'City': {count: 1000, type: `string`},
              'Rating': {count: 250, type: `number`},
            },
          };
        }
      },
    });

    this.filterControl = app.querySelector(`builder-filter-add-control`);
    this.filterControl.querySelector(`.add-filter-button`).click();
    await nextAnimationFrame();

    this.filterMenu = this.filterControl.querySelector(`mp-drop-menu`);
    // Need to wait for the various mocked api requests to complete before the menu is populated.
    await elementFnIsVisibleAsync(() => queryShadowSelectors(
      this.filterMenu,
      [`mp-items-menu`, `.list-option .option-label`]
    ));
  });

  it(`clears values when changing property`, async function() {
    let currScreen;

    // Click on 'City' property
    currScreen = await currentScreenAsync(this.filterMenu, `builder-screen-filter-properties-list`);
    const listOption1 = Array.from(queryShadowSelectorsAll(currScreen, [`mp-items-menu`, `.list-option .option-label`]))
      .find(optionLabel => optionLabel.textContent.includes(`City`));
    listOption1.click();
    currScreen = await currentScreenAsync(this.filterMenu, `builder-screen-filter-property`);

    // Type some input on filter screen
    const valueInput = currScreen.querySelector(`.filter-string-input`);
    sendInput(valueInput, `placeholder`);
    await nextAnimationFrame();

    // Navigate back to properties list
    const backButton = currScreen.querySelector(`.screen-title .back-button`);
    backButton.click();
    currScreen = await currentScreenAsync(this.filterMenu, `builder-screen-filter-properties-list`);

    // Click on 'Rating' property
    const listOption2 = Array.from(queryShadowSelectorsAll(currScreen, [`mp-items-menu`, `.list-option .option-label`]))
      .find(optionLabel => optionLabel.textContent.includes(`Rating`));
    listOption2.click();
    currScreen = await currentScreenAsync(this.filterMenu, `builder-screen-filter-property`);

    // Expect there to be two empty number inputs
    const numberInputs = currScreen.querySelectorAll(`.filter-numdate-input`);
    expect(numberInputs.length).to.equal(2);
    expect(numberInputs[0].value).to.equal(``);
    expect(numberInputs[1].value).to.equal(``);
  });
});
