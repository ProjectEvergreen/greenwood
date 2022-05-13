/* eslint-disable no-underscore-dangle */

document.addEventListener('click', function(e) {
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

  if (canClientSideRoute) {
    e.preventDefault();

    const route = href.replace(window.location.origin, '');
    const routerOutlet = Array.from(document.getElementsByTagName('greenwood-route')).filter(outlet => {
      return outlet.getAttribute('data-route') === route;
    })[0];

    if (routerOutlet.getAttribute('data-template') === window.__greenwood.currentTemplate) {
      window.__greenwood.lastRoutes.push(window.location.pathname);

      routerOutlet.loadRoute();
    } else {
      window.location.href = href;
    }
  }
});

window.addEventListener('popstate', event => {
  try {
    if (window.__greenwood.lastRoutes.length > 0) {
      const lastRoute = window.__greenwood.lastRoutes.pop();
      const routerOutlet = Array.from(document.getElementsByTagName('greenwood-route')).filter(outlet => {
        return outlet.getAttribute('data-route') === lastRoute;
      })[0];

      routerOutlet.loadRoute();
    } else {
      history.go(-1);
    }
  } catch(e) {
    console.debug('Unexpected error trying to go back.');
    console.error(e);
  }
});

class RouteComponent extends HTMLElement {
  loadRoute() {
    const route = this.getAttribute('data-route');
    const key = this.getAttribute('data-key');

    fetch(key)
      .then(res => res.text())
      .then((response) => {
        history.pushState(response, route, route);
        document.getElementsByTagName('router-outlet')[0].innerHTML = response;
      });
  }
}

class RouterOutletComponent extends HTMLElement { }

customElements.define('greenwood-route', RouteComponent);
customElements.define('router-outlet', RouterOutletComponent);