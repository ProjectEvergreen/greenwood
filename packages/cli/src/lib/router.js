/* eslint-disable no-underscore-dangle */
document.addEventListener('click', function(e) {
  e.preventDefault();

  console.debug('linked clicked was...', e.path[0].href);
  const target = e.path[0];
  const route = target.href.replace(window.location.origin, '');
  const routerOutlet = Array.from(document.getElementsByTagName('greenwood-route')).filter(outlet => {
    return outlet.getAttribute('data-route') === route;
  })[0];

  console.debug('routerOutlet', routerOutlet);

  if (routerOutlet.getAttribute('data-template') === window.__greenwood.currentTemplate) {
    window.__greenwood.currentTemplate = routerOutlet.getAttribute('data-template');
    routerOutlet.loadRoute();
  } else {
    console.debug('new template detected, should do a hard reload');
    window.location.href = target;
  }
});

class RouteComponent extends HTMLElement {
  loadRoute() {
    console.debug('load route ->', this.getAttribute('data-route'));
    console.debug('with bundle ->', this.getAttribute('data-key'));
    fetch(this.getAttribute('data-key'))
      .then(res => res.text())
      .then((response) => {
        document.getElementsByTagName('router-outlet')[0].innerHTML = response;
      });
  }
}

class RouterOutletComponent extends HTMLElement { }

customElements.define('greenwood-route', RouteComponent);
customElements.define('router-outlet', RouterOutletComponent); 