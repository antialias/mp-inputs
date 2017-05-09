export const Async = {
  nextAnimationFrame() {
    return new Promise(requestAnimationFrame);
  },

  sleep(durationMs) {
    return new Promise(resolve => setTimeout(resolve, durationMs));
  },

  async condition(predicate) {
    let val = predicate();
    while (!val) {
      await this.sleep(50);
      val = predicate();
    }
    return val;
  },

  async currentScreen(container, screenName) {
    let currentScreen = null;
    await this.condition(() => {
      const screens = container.querySelectorAll(`[screen-index]`);
      currentScreen = screens.length ? screens[screens.length - 1] : null;
      return !!(currentScreen && currentScreen.tagName.toLowerCase() === screenName.toLowerCase());
    });
    return currentScreen;
  },

  async elementIsVisible(element) {
    await this.condition(() => {
      // Based on http://stackoverflow.com/a/21696585
      return !!(element && element.offsetParent);
    });
    return element;
  },

  async selectorIsVisible(selector) {
    let element = null;
    await this.condition(() => {
      element = selector();
      return !!(element && element.offsetParent);
    });
    return element;
  },
};

export function sendInput(inputEl, value) {
  inputEl.value = value;
  inputEl.dispatchEvent(new Event(`input`, {bubbles: true}));
}
