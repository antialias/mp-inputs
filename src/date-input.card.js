import devboard from 'devboard';
import {ResizeInput} from '.';
const card = devboard.ns('date input');

card('hello awesome world', devboard.DOMNode(node => {
  node.innerHTML = `this is a node <resize-input></resize-input>`;
}));
