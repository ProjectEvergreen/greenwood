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

    console.debug({ route });
    console.debug(window.location.pathname);

    const routerOutlet = Array.from(document.getElementsByTagName('greenwood-route')).filter(outlet => {
      return outlet.getAttribute('data-route') === route;
    })[0];

    if (routerOutlet.getAttribute('data-template') === window.__greenwood.currentTemplate) {
      window.__greenwood.lastRoutes.push(window.location.pathname);
      console.debug('current template', window.__greenwood.currentTemplate);
      console.debug('push route', routerOutlet.getAttribute('data-route'));

      routerOutlet.loadRoute();
    } else {
      window.location.href = href;
    }
  }
});

window.addEventListener('popstate', event => {
  console.debug('BACK BUTTON!');
  console.debug({ event });
  console.debug(window.__greenwood.lastRoutes);

  if (window.__greenwood.lastRoutes.length > 0) {
    const lastRoute = window.__greenwood.lastRoutes.pop();

    console.debug('same template, reuse and just fetch route partial');
    console.debug({ lastRoute });

    const routerOutlet = Array.from(document.getElementsByTagName('greenwood-route')).filter(outlet => {
      return outlet.getAttribute('data-route') === lastRoute;
    })[0];

    console.debug({ routerOutlet });

    if (routerOutlet && routerOutlet.getAttribute('data-template') === window.__greenwood.currentTemplate) {
      console.debug('same template, reuse');
      routerOutlet.loadRoute();
    } else {
      console.error('OOPS!  This should not have happened.  Please open an issue on our Github repo');
      console.debug('https://github.com/ProjectEvergreen/greenwoodpo');
    }
  } else {
    console.debug('breaking template boundary, follow the browser and pass go(-1)');
    history.go(-1);
  }

  console.debug('=====================');
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