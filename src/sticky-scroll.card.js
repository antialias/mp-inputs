import devboard from 'devboard';
import '.'; // sticky-scroll
const card = devboard.ns('<sticky-scroll>');
card('basic', devboard.DOMNode(node => {
  node.innerHTML = `<sticky-scroll style='width: 100px; height:100px; display: block; overflow: scroll'><div class='body'><div class='sticky-title'>this is the sticky title</div>${new Array(100).fill(undefined).map(n => 'hello stuck world').join(' ')}</div></sticky-scroll>`;
}));
