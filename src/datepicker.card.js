import devboard from 'devboard';
import '.';
const card = devboard.ns('<mp-datepicker>');
card('basic', devboard.DOMNode(node => {
        node.innerHTML = `<mp-datepicker></mp-datepicker>`;
}));
