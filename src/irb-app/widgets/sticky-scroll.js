import WebComponent from 'webcomponent';

import * as util from '../../util';

import './sticky-scroll.styl';

document.registerElement('sticky-scroll', class extends WebComponent {
  attributeChangedCallback(){
    window.requestAnimationFrame(() => this.updateIfInitialized());
  }

  createdCallback() {
    this.firstScroll = true;
    this.stickyBody = null;
    this.stickyHeader = null;
    this.onBodyScrollHandler = util.debounce(() => {
      this.updateIfInitialized();
    });
    this.onFirstScrollHandler = ()=> {
      if (this.firstScroll) {
        if (!this.className.includes(' sticky')) {
          this.className += ' sticky';
        }
        this.stickyBody = this.querySelector('.body');
        this.stickyHeader = document.createElement('div');
        this.stickyHeader.style.width = `${this.stickyBody.clientWidth}px`;
        this.stickyHeader.className = 'sticky-header';
        this.appendChild(this.stickyHeader);
        this.render();
        this.firstScroll = false;
        this.stickyBody.addEventListener('scroll', this.onBodyScrollHandler);
      }
    };

    this.addEventListener('scroll', this.onFirstScrollHandler);
  }

  detachedCallback(){
    this.stickyBody.removeEventListener('scroll', this.onBodyScrollHandler);
    this.removeEventListener('scroll', this.onFirstScrollHandler);
  }

  hideTitle(title) {
    title.style.marginTop = `-${title.offsetHeight}px`;
  }

  moveTitleAtIndex(idx, px) {
    const title = this.headerStickyTitles[idx];
    title.style.marginTop = `${px}px`;
  }

  render() {
    this.bodyStickyTitles = [].slice.call(this.stickyBody.getElementsByClassName('sticky-title'));
    while (this.stickyHeader.hasChildNodes()) {
      this.stickyHeader.removeChild(this.stickyHeader.lastChild);
    }
    this.headerStickyTitles = this.bodyStickyTitles.map(title => title.cloneNode(true));
    this.headerStickyTitles.forEach((title, idx) => {
      title.onclick = this.bodyStickyTitles[idx].onclick;
      this.stickyHeader.appendChild(title);
    });
    this.resetStickyHeaders();
  }

  resetStickyHeaders() {
    if (this.headerStickyTitles.length) {
      this.headerStickyTitles.forEach(title => title.style.marginTop = `-${title.offsetHeight}px`);
      this.updateStuckHeader();
    }
  }

  showTitle(title) {
    title.style.marginTop = '';
  }

  updateIfInitialized() {
    if (!this.firstScroll) {
      this.render();
    }
  }

  updateStuckHeader() {
    const bodyScrollTop = this.stickyBody.scrollTop;
    const titleDistances = this.bodyStickyTitles.map(title => title.offsetTop - bodyScrollTop);
    const headerHeight = '25'; //this.currentHeaderHeight();
    this.headerStickyTitles.forEach((title, idx) => {
      if (titleDistances[idx] <= headerHeight && (titleDistances[idx + 1] >= headerHeight || !titleDistances[idx + 1])) {
        if (titleDistances[idx] <= 0) {
          this.showTitle(title);
        } else {
          this.hideTitle(title);
          this.moveTitleAtIndex(idx - 1, titleDistances[idx] - headerHeight);
        }
      } else {
        this.hideTitle(title);
      }
    });
  }
});
