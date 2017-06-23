import devboard from 'devboard';
import '.';
const card = devboard.ns('<resize-date-input>');

card('basic', devboard.DOMNode(node => {
  node.innerHTML = `<resize-date-input placeholder='the placeholder'></resize-date-input>`;
}));
