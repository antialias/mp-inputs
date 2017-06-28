import devboard from 'devboard';
import {DatePicker} from '.';
const card = devboard.ns('<insights-datepicker>');
card('basic', devboard.DOMNode(node => {
        node.innerHTML = `<${DatePicker.tagName}></${DatePicker.tagName}>`;
}));
