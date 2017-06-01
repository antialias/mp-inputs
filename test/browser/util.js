export function nextAnimationFrameAsync() {
  return new Promise(requestAnimationFrame);
}

export function sleepAsync(durationMs) {
  return new Promise(resolve => setTimeout(resolve, durationMs));
}

export async function conditionAsync(predicate) {
  let val = predicate();
  while (!val) {
    await sleepAsync(50);
    val = predicate();
  }
  return val;
}

export async function elementIsVisibleAsync(element) {
  return await conditionAsync(() => {
    // Based on http://stackoverflow.com/a/21696585
    return !!(element && element.offsetParent) ? element : null;
  });
}

export async function elementFnIsVisibleAsync(elementFn) {
  return await conditionAsync(() => {
    const element = elementFn();
    return !!(element && element.offsetParent) ? element : null;
  });
}

export function queryShadowSelectors(rootEl, selectors) {
  let currEl = rootEl;
  selectors.forEach((selector, idx) => {
    currEl = currEl.querySelector(selector);
    if (idx !== selectors.length - 1) {
      if (!currEl) {
        return;
      }
      currEl = currEl.shadowRoot;
    }
  });
  return currEl;
}

export function queryShadowSelectorsAll(rootEl, selectors) {
  let currEl = rootEl;
  selectors.forEach((selector, idx) => {
    if (idx !== selectors.length - 1) {
      currEl = currEl.querySelector(selector);
      if (!currEl) {
        return;
      }
      currEl = currEl.shadowRoot;
    } else {
      currEl = currEl.querySelectorAll(selector);
    }
  });
  return currEl;
}

export function sendInput(inputEl, value) {
  inputEl.value = value;
  inputEl.dispatchEvent(new Event(`input`, {bubbles: true}));
}
