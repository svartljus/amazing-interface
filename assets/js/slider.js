import { html } from 'https://unpkg.com/lit-html/lit-html.js';
import { component } from 'https://unpkg.com/haunted/haunted.js';

function Slider({ name }) {
	return html`Hello ${name}`;
}

customElements.define('x-slider', component(Slider));
