import devboard from 'devboard';
import '.'; // date-input
const card = devboard.ns('<date-input>');
card('basic', devboard.DOMNode(node => {
  node.innerHTML = `<date-input></date-input>`;
}));
