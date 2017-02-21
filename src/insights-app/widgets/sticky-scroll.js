import WebComponent from 'webcomponent';

import throttle from 'lodash/throttle';

import './sticky-scroll.styl';

document.registerElement(`sticky-scroll`, class extends WebComponent {
  attributeChangedCallback() {
    window.requestAnimationFrame(() => this.updateIfInitialized());
  }

  createdCallback() {
    this.firstScroll = true;
    this.stickyBody = null;
    this.stickyHeader = null;
    this.stuckTitle = null;

    this.onBodyScrollHandler = throttle(() => this.updateStuckHeader(), 10);
    this.onFirstScrollHandler = ()=> {
      if (this.firstScroll) {
        this.style.overflowY = `hidden`;
        this.stickyBody = this.querySelector(`.body`);
        this.stickyBody.style.overflowY = `auto`;
        this.stickyBody.scrollTop = this.scrollTop;
        this.stickyHeader = document.createElement(`div`);
        this.setWidth();
        this.stickyHeader.classList.add(`sticky-header`);
        this.appendChild(this.stickyHeader);
        this.render();
        this.firstScroll = false;
        this.stickyBody.addEventListener(`scroll`, this.onBodyScrollHandler);
      }
    };

    this.addEventListener(`scroll`, this.onFirstScrollHandler);
  }

  detachedCallback() {
    this.removeEventListener(`scroll`, this.onFirstScrollHandler);
    if (this.stickyBody) {
      this.stickyBody.removeEventListener(`scroll`, this.onBodyScrollHandler);
    }
  }

  hideTitle(title) {
    title.classList.remove(`stuck`);
    title.style.marginTop = `-${title.offsetHeight}px`;
  }

  moveTitleAtIndex(idx, px) {
    const title = this.headerStickyTitles[idx];
    title.classList.add(`stuck`);
    this.stuckTitle = title;
    title.style.marginTop = `${px}px`;
  }

  render() {
    this.bodyStickyTitles = [...this.stickyBody.getElementsByClassName(`sticky-title`)];
    while (this.stickyHeader.hasChildNodes()) {
      this.stickyHeader.removeChild(this.stickyHeader.lastChild);
    }
    this.headerStickyTitles = this.bodyStickyTitles.map(title => title.cloneNode(true));
    this.headerStickyTitles.forEach((title, idx) => {
      title.onclick = this.bodyStickyTitles[idx].onclick;
      this.stickyHeader.appendChild(title);
    });
    this.setWidth();
    this.resetStickyHeaders();
  }

  resetStickyHeaders() {
    if (this.headerStickyTitles.length) {
      this.headerStickyTitles.forEach(title => title.style.marginTop = `-${title.offsetHeight}px`);
      this.updateStuckHeader();
    }
  }

  setWidth() {
    this.stickyHeader.style.width = `${this.stickyBody.clientWidth}px`;
  }

  showTitle(title) {
    title.classList.add(`stuck`);
    this.stuckTitle = title;
    title.style.marginTop = ``;
  }

  updateIfInitialized() {
    if (!this.firstScroll) {
      this.render();
    }
  }

  updateStuckHeader() {
    if (this.headerStickyTitles.length) {
      const bodyScrollTop = this.stickyBody.scrollTop;
      const titleDistances = this.bodyStickyTitles.map(title => title.offsetTop - bodyScrollTop);
      this.stuckTitle = this.stuckTitle || this.headerStickyTitles[0];
      const headerHeight = this.stuckTitle.offsetHeight;
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
  }
});
