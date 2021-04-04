/* eslint-disable no-underscore-dangle */
document.addEventListener('click', function(e) {
  const href = e.path && e.path[0]
    ? e.path[0].href // chrome
    : e.originalTarget && e.originalTarget.href
      ? e.originalTarget.href // firefox
      : null;

  if (href) {
    e.preventDefault();
    const route = href.replace(window.location.origin, '');
    const routerOutlet = Array.from(document.getElementsByTagName('greenwood-route')).filter(outlet => {
      return outlet.getAttribute('data-route') === route;
    })[0];

    if (routerOutlet.getAttribute('data-template') === window.__greenwood.currentTemplate) {
      window.__greenwood.currentTemplate = routerOutlet.getAttribute('data-template');
      routerOutlet.loadRoute();
    } else {
      window.location.href = href;
    }
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