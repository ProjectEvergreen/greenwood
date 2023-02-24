/* eslint-disable no-underscore-dangle */

document.addEventListener('click', async function(e) {
  const currentUrl = window.location;
  // https://developer.mozilla.org/en-US/docs/Web/API/Event/composedPath
  const href = e.composedPath && e.composedPath()[0].tagName === 'A'
    ? e.composedPath()[0].href
    : '';

  // best case "guess" is that if the link originates on the current site when resolved by the browser
  // treat it as a client side route, ex:  /about/, /docs/ and trigger the client side router
  // https://github.com/ProjectEvergreen/greenwood/issues/562
  const isOnCurrentDomain = href.indexOf(currentUrl.hostname) >= 0 || href.indexOf('localhost') >= 0;
  const canClientSideRoute = href !== '' && isOnCurrentDomain;

  if (canClientSideRoute) {
    e.preventDefault();

    const targetUrl = new URL(href, currentUrl.origin);
    const routerOutlet = Array.from(document.getElementsByTagName('greenwood-route')).filter(outlet => {
      return outlet.getAttribute('data-route') === targetUrl.pathname;
    })[0];

    // maintain the app shell if we are navigating between pages that are built from the same page template
    // also, some routes may be SSR, so we may not always match on a static route
    if (routerOutlet && routerOutlet.getAttribute('data-template') === window.__greenwood.currentTemplate) {
      const { hash, pathname } = targetUrl;

      if (currentUrl.pathname !== pathname) {
        await routerOutlet.loadRoute();

        history.pushState({}, '', pathname);
      }

      if (hash !== '') {
        currentUrl.hash = hash;
      }
    } else {
      // this page uses is a completely different page template from the current page
      // so just load the new page
      window.location.href = href;
    }
  }
});

window.addEventListener('popstate', () => {
  try {
    const targetRoute = window.location;
    const routerOutlet = Array.from(document.getElementsByTagName('greenwood-route')).filter(outlet => {
      return outlet.getAttribute('data-route') === targetRoute.pathname;
    })[0];

    if (routerOutlet) {
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
        document.getElementsByTagName('router-outlet')[0].innerHTML = response;
      });
  }
}

class RouterOutletComponent extends HTMLElement { }

customElements.define('greenwood-route', RouteComponent);
customElements.define('router-outlet', RouterOutletComponent);