export default class EventDetailsPage extends HTMLElement {
  async connectedCallback() {
    this.innerHTML = `
      <p>Events</p>
    `;
  }
}

// make sure static exports do not get treated as a serverless function
export const staticExport = true;
