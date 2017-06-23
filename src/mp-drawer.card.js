
import devboard from 'devboard';
import '.'; // mp-drawer
const card = devboard.ns('<mp-drawer>');
card('hide=true', devboard.DOMNode(node => {
  node.innerHTML = `<mp-drawer hide='true'>hidden drawer content</mp-drawer>`;
}));
card('not hidden', devboard.DOMNode(node => {
  node.innerHTML = `<mp-drawer>not hidden drawer content</mp-drawer>`;
}));
