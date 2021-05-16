import { html } from 'https://unpkg.com/lit-html/lit-html.js';
import { component, useState } from 'https://unpkg.com/haunted/haunted.js';

const CSS = `
	:root {
		-: #f0f;
	}

	div {
		width: 100%;
		height: 100%;
	}

	svg {
		color: var(--color);
	}
`

function Rotary({ min=0, max=100, value=0 }) {
	const [dragging, setDragging] = useState(false)
	const [startX, setStartX] = useState(-1)
	const [startY, setStartY] = useState(-1)

	const SIDE_ANGLE = 135 // 90+45 degrees
	const FULL_ANGLE = 270

	const initialPercent = (value - min) / (max - min)
	const initialAngle = -SIDE_ANGLE + FULL_ANGLE * initialPercent

	const [startAngle, setStartAngle] = useState(initialAngle)
	const [angle, setAngle] = useState(initialAngle)
	const [percent, setPercent] = useState(initialPercent)

	const calculateAngle = (x, y) => {
		const w = this.offsetWidth
		const h = this.offsetHeight
		const dx = x - w/2
		const dy = y - h/2
		const a = Math.atan2(dx, -dy) * 180.0 / Math.PI
		// Angle 0 = up, Angle -90 = Left, Angle 90 = Right
		return a
	}

	const rangecallback = (e) => {
		console.log('in rangecallback', e)
		e.stopPropagation()
	}

	const mouseup = (e) => {
		console.log('in mouseup', e)
		setDragging(false)
		e.stopPropagation()
	}

	const mousedown = (e) => {
		console.log('in mousedown', e, e.target, this.offsetWidth, this.offsetHeight)
		setStartX(e.offsetX)
		setStartY(e.offsetY)
		const a = calculateAngle(e.offsetX, e.offsetY)
		setStartAngle(a)
		setAngle(a)
		setDragging(true)
		e.stopPropagation()
	}

	const mousemove = (e) => {
		if (dragging) {
			let a = calculateAngle(e.offsetX, e.offsetY)
			a = Math.max(-SIDE_ANGLE, Math.min(SIDE_ANGLE, a))
			let percent = (a + SIDE_ANGLE) / FULL_ANGLE
			setPercent(percent)
			let value = min + (max - min) * percent
			setAngle(a)
			this.value = value
			const checkEvent = new CustomEvent("change", {
				bubbles: true,
				cancelable: false,
				value,
			});
			this.dispatchEvent(checkEvent);
		}
	}

	const dash1 = Math.round(percent * 75) // seems to be in view unit lengths
	const dash2 = 1000 // hackety hack

	return html `<style>${CSS}</style><div
			@mousedown=${mousedown}
			@mouseup=${mouseup}
			@mousemove=${mousemove}
		>
		<svg width="100%" height="100%" viewBox="0 0 40 40">
			<g transform="translate(20,20)">
				<circle cx="0" cy="0" r="16" fill="transparent" stroke="rgba(255,255,255,0.05)" stroke-width="5"></circle>
				<g transform="rotate(135)">
					<circle cx="0" cy="0" r="16" fill="transparent" stroke="currentColor" stroke-width="5" stroke-dasharray="${dash1} ${dash2}" stroke-dashoffset="0"></circle>
				</g>
			</g>
		</svg>
	`;
}

customElements.define('x-rotary', component(Rotary));
