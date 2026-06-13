export default class EventDetailsPage extends HTMLElement {
  async connectedCallback() {
    this.innerHTML = `
      <p>Events</p>
    `;
  }
}

// make sure prerendering does not get treated as a serverless function
export const prerender = true;
