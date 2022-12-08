/* eslint-disable no-underscore-dangle */

// ** THIS DOES NOT WORK ON SAFARI **
// It will just load pages as if staticRouter was not enabled
// https://github.com/ProjectEvergreen/greenwood/issues/559
document.addEventListener('click', async function(e) {
  const currentUrl = window.location;
  const href = (e.path && e.path[0]
    ? e.path[0].href // chrome + edge
    : e.originalTarget && e.originalTarget.href
      ? e.originalTarget.href // firefox
      : '') || '';
  // best case "guess" is that if the link originates on the current site when resolved by the browser
  // treat it as a client side route, ex:  /about/, /docs/ and trigger the client side router
  // https://github.com/ProjectEvergreen/greenwood/issues/562
  const isOnCurrentDomain = href.indexOf(currentUrl.hostname) >= 0 || href.indexOf('localhost') >= 0;
  const canClientSideRoute = href !== '' && isOnCurrentDomain;

  if (canClientSideRoute) {
    e.preventDefault();

    console.debug({ currentUrl });

    const targetUrl = new URL(href, currentUrl.origin);
    const routerOutlet = Array.from(document.getElementsByTagName('greenwood-route')).filter(outlet => {
      return outlet.getAttribute('data-route') === targetUrl.pathname;
    })[0];

    console.debug({ targetUrl });
    // maintain the app shell if we are navigating between pages that are built from the same page template
    // also, some routes may be SSR, so we may not always match on a static route
    if (routerOutlet && routerOutlet.getAttribute('data-template') === window.__greenwood.currentTemplate) {
      // only update the hash if it just the hash changing
      // else, request and load the partial for the page, and push page to the browser history stack
      // if (targetUrl.hash !== '' && window.location) {
      //   console.debug('111 HASH', targetUrl.hash);
      //   location = targetUrl.hash;
      // } else {
      //   console.debug('222 PUSH STATE', targetUrl.pathname);
      //   routerOutlet.loadRoute();
      //   history.pushState({}, '', targetUrl.pathname);
      // }
      console.debug('TARGET PATHNAME', targetUrl.pathname);
      console.debug('TARGET HASH', targetUrl.hash);

      if (currentUrl.pathname !== targetUrl.pathname) {
        console.debug('111 PUSH STATE TO NEW PATHNAME');
        await routerOutlet.loadRoute();
        // history.pushState({}, '', `${targetUrl.pathname}${targetUrl.hash}`);
        history.pushState({}, '', targetUrl.pathname);
      }

      if (targetUrl.hash !== '') {
        console.debug('222 HASH');
        currentUrl.hash = targetUrl.hash;
        // history.pushState({}, '', targetUrl.hash);
        // setTimeout(() => {
        //   console.debug('222bbb', targetUrl.hash);
        //   currentUrl.hash = targetUrl.hash;
        //   history.pushState({}, '', targetUrl.hash);
        //   // currentUrl.hash = targetUrl.hash;
        // }, 500);
      }
    } else {
      // this page uses is a completely different page template from the current page
      // so just load the new page
      console.debug('ooopsy doopsy???', { href });
      window.location.href = href;
    }
  }
});

window.addEventListener('popstate', (event) => {
  try {
    console.debug('popstate', { event });

    const targetRoute = window.location;
    const routerOutlet = Array.from(document.getElementsByTagName('greenwood-route')).filter(outlet => {
      return outlet.getAttribute('data-route') === targetRoute.pathname;
    })[0];

    if (routerOutlet) {
      console.debug('popstate loadRoute');
      // TODO do we need to handle hash here too?
      routerOutlet.loadRoute();
    }
  } catch (err) {
    console.error('Unexpected error trying to go back.', err);
  }
});

class RouteComponent extends HTMLElement {
  async loadRoute() {
    const key = this.getAttribute('data-key');

    await fetch(key)
      .then(res => res.text())
      .then((response) => {
        console.debug('HTML LOADED!!!');
        document.getElementsByTagName('router-outlet')[0].innerHTML = response;
      });
  }
}

class RouterOutletComponent extends HTMLElement { }

customElements.define('greenwood-route', RouteComponent);
customElements.define('router-outlet', RouterOutletComponent);