const template = document.createElement('template');

template.innerHTML = `
  <div class="my-logo">
    <style>
      .my-logo {
        height: 100px;
        line-height: 100px;
        font-size: 36px;
        color: transparent;
      }

      .spacer {
        height: 100px;
        width: 100px;
        display: block;
        margin-top: -100px;
      }

      .my-logo div {
        display: inline-block;
        max-width: 35%;
        vertical-align: middle;
        border-radius: 20px;
        vertical-align: top;
      }

      svg {
        will-change: filter;
        transition: filter 300ms;
        width: 80%;
      }

      @keyframes logo-spin {
        from {
          transform: rotate(0deg);
        }

        to {
          transform: rotate(360deg);
        }
      }

      /* https://stackoverflow.com/a/40996404/417806 */
      @keyframes leafanimation {
        0% {transform:translate(1000px,500px) rotate(0deg);}
        20% {transform:translate(850px,450px) rotate(360deg);}
        40% {transform:translate(450px,200px) rotate(720deg);}
        60% {transform:translate(100px,100px) rotate(1080deg);}
        80% {transform:translate(0,0) rotate(1440deg);}
        100% {transform:translate(0,0) rotate(1440deg);}
      }

      @media (prefers-reduced-motion: no-preference) {
        .my-logo {
          animation: leafanimation 6s linear;
        }
      }

      @media(min-width: 500px) {
        .my-logo div {
          max-width: 23%;
        }
      }

      @media(min-width: 768px) {
        .my-logo div {
          max-width: 15%;
        }
      }

      @media(min-width: 1024px) {
        .my-logo div {
          max-width: 10%;
        }
      }
    </style>

    <span class="spacer"></span>

    <div>
      <svg width="100%" height="100%" viewBox="0 0 150 180" fill="#00b68f">
        <defs>
          <style>
            .shading {
              fill: #1ad6a9;
            }
          </style>
        </defs>
        <g>
          <g>
            <g>
              <path d="M81.32,142.25c-1.07.63-1.58,1.9-1.26,3.09,5.15,19.17-7.94,33.56,4.33,33.56,10.15,0,16.65-.48,16.65-14.91,0-10.63-2.06-25.06-5.08-27.12-2.32-1.59-10.84,3.12-14.64,5.38Z"/>
              <path class="shading" d="M87.57,172.18c-.87.02-1.52-.8-1.32-1.64.13-.53.26-1.06.38-1.54,1.35-5.44,1.62-16.56-.67-25.59,2.65-1.11,6.78-2.61,8.45-3.15,1.43,4.2,2.65,15.98,2.65,23.73,0,4.62-1.04,6.8-2.01,7.29-1.29.65-4.43.84-7.47.9Z"/>
            </g>
            <path d="M20.78.05c.35-2.48-43.96,89.96-4.22,131.69,38.68,40.62,107.46,7.08,110.82-31.56C130.45,64.79,101.48,11.12,20.78.05Z"/>
            <path class="shading" d="M119.87,99.53c-.9,10.31-9.73,30.5-34.22,40.27C76.61,67.13,38.01,20.47,26.37,8.54c39.28,6.82,61.55,23.92,73.47,37.44,14.07,15.96,21.56,35.98,20.03,53.55Z"/>
          </g>
        </g>
      </svg>
    </div>
  </div>
`;

class Logo extends HTMLElement {
  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.appendChild(template.content.cloneNode(true));
    }
  }
}

customElements.define('x-logo', Logo);