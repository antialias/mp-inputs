import devboard from 'devboard';
import {ResizeInput} from '.';
const card = devboard.ns('<resize-input>');
card('basic', devboard.DOMNode(node => {
  node.innerHTML = `<resize-input placeholder='the placeholder'></resize-input>`;
}));
