import devboard from 'devboard';
import {ResizeDateInput} from '.';
const card = devboard.ns('<resize-date-input>');

card('basic', devboard.DOMNode(node => {
  node.innerHTML = `<${ResizeDateInput.tagName} placeholder='the placeholder'></${ResizeDateInput.tagName}>`;
}));
