/* eslint-disable no-underscore-dangle */

// ** THIS DOES NOT WORK ON SAFARI **
// It will just load pages as if staticRouter was not enabled

document.addEventListener('click', function(e) {
  console.debug(window.location);
  const href = (e.path && e.path[0]
    ? e.path[0].href // chrome + edge
    : e.originalTarget && e.originalTarget.href
      ? e.originalTarget.href // firefox
      : '') || '';
  // best case "guess" is that if the link originates on the current site when resolved by the browser
  // treat it as a client side route, ex:  /about/, /docs/ and trigger the client side router
  // https://github.com/ProjectEvergreen/greenwood/issues/562
  const isOnCurrentDomain = href.indexOf(window.location.hostname) >= 0 || href.indexOf('localhost') >= 0;
  const canClientSideRoute = href !== '' && isOnCurrentDomain;

  console.debug({ href });
  console.debug('can client side route', canClientSideRoute);
  if (canClientSideRoute) {
    console.debug('STARTING FROM -> ', window.location.pathname);

    window.__greenwood.enableRouter = true;
    e.preventDefault();

    const targetUrl = new URL(href, window.location.origin);
    console.debug({ targetUrl });

    console.debug('TARGET URL -> ', targetUrl.pathname);

    const routerOutlet = Array.from(document.getElementsByTagName('greenwood-route')).filter(outlet => {
      return outlet.getAttribute('data-route') === targetUrl.pathname;
    })[0];
    console.debug({ routerOutlet });

    if (routerOutlet.getAttribute('data-template') === window.__greenwood.currentTemplate) {
      console.debug('same template, persist template');
      console.debug('HASH ???????', targetUrl.hash);

      if (targetUrl.hash !== '') {
        console.debug('just a hash change');
        location = targetUrl.hash;
      } else {
        console.debug('else use routerOutlet to load the new route');
        routerOutlet.loadRoute();
        history.pushState({}, '', targetUrl.pathname);
      }
      console.debug('*******************');
    } else {
      console.debug('different template, hard load href', href);
      window.location.href = href;
    }
  }
});

window.addEventListener('popstate', (e) => {
  console.debug('!!!!!!! POP STATE <MOVING << OR >>', window.location);
  console.debug(e);

  // TODO
  // if (window.__greenwood.enableRouter) {
  try {
    const targetRoute = window.location;
    console.debug('BROWSER MOVING TO....', targetRoute.pathname);
    console.debug('WITH HASH ???', targetRoute.hash);
    const routerOutlet = Array.from(document.getElementsByTagName('greenwood-route')).filter(outlet => {
      return outlet.getAttribute('data-route') === targetRoute.pathname;
    })[0];

    console.debug({ routerOutlet });
    if (routerOutlet) {
      routerOutlet.loadRoute();
    }
  } catch (err) {
    console.debug('Unexpected error trying to go back.');
    console.error(err);
  }
  console.debug('=================================');
  //  }
});

class RouteComponent extends HTMLElement {
  loadRoute() {
    const key = this.getAttribute('data-key');

    fetch(key)
      .then(res => res.text())
      .then((response) => {
        document.getElementsByTagName('router-outlet')[0].innerHTML = response;
      });
  }
}

class RouterOutletComponent extends HTMLElement { }

customElements.define('greenwood-route', RouteComponent);
customElements.define('router-outlet', RouterOutletComponent);