import { html, css, LitElement } from 'lit-element';

class Loading extends LitElement {
    static get styles() {
        return css`
            div {
                height: 100vh;
                width: 100vw;
            }
        `
    }
    render() {
        return html`
            <div></div>
        `;
    }
}

customElements.define('eve-loading', Loading);