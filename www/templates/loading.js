import { html, css, LitElement } from 'lit-element';

class LoadingComponent extends LitElement {
    static get styles() {
        return css`
            div {
                height: calc(100vh - 70px - 40px);
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

customElements.define('eve-loading', LoadingComponent);