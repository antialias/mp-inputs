export function mirrorLocationHash(parentFrame) {
  // use replaceState in child frame so it doesn't touch browser
  // history except through communication with parent frame
  const origReplaceState = window.history.replaceState;
  window.history.replaceState = function() {
    origReplaceState.apply(this, arguments);
    parentFrame.send('hashChange', window.location.hash);
  };

  parentFrame.addHandler('hashChange', hash => {
    if (hash !== window.location.hash) {
      window.history.replaceState(null, null, hash.replace(/^#*/, '#'));
    }
  });

  window.addEventListener('popstate', () => parentFrame.send('hashChange', window.location.hash));
}
