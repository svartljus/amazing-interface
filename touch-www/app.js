const LAYOUT = {};
LAYOUT.grid = 20;

window.addEventListener('load', () => {
	loadFile('index.xml');
});

/* load XML */

function loadFile(url, callback) {
	var xhr = new XMLHttpRequest();
	xhr.arguments = Array.prototype.slice.call(arguments, 2);
	xhr.onload = () => {
		const serializer = new XMLSerializer();
		const dom = xhr.responseXML.documentElement;
		const xmlStr = serializer.serializeToString(dom);
		data = xml2js(xmlStr, { compact: true, spaces: 4 });

		tidy(data);

		console.log(data);

		drawInterface(data);

		window.onload = setSize();
		// window.onresize = setSize();
	};
	xhr.open('GET', url, true);
	xhr.send(null);
}

// let ws = new WebSocket('ws://192.168.10.234:9001');
let ws = new WebSocket('wss://mio-server.glitch.me');

/* draw interface */

function tidy(data) {
	data.layout.attr = data.layout._attributes;
	delete data.layout._attributes;
	if (!Array.isArray(data.layout.tabpage)) {
		data.layout.tabpage = new Array(data.layout.tabpage);
	}
	for (let page of data.layout.tabpage) {
		page.attr = page._attributes;
		page.attr.name = atob(page.attr.name);
		delete page._attributes;
		if (!Array.isArray(page.control)) {
			page.control = new Array(page.control);
		}
		for (let control of page.control) {
			control.attr = control._attributes;
			control.attr.name = atob(control.attr.name);
			delete control._attributes;
			for (const [key, value] of Object.entries(control.attr)) {
				if (value === 'false') control.attr[key] = false;
				if (value === 'true') control.attr[key] = true;
			}
			// for (let attr of control.attr) {
			// 	if (attr === 'false') attr = false;
			// 	if (attr === 'true') attr = true;
			// }
		}
	}
}

function drawInterface(data) {
	const aside = document.createElement('aside');
	const main = document.createElement('main');
	document.body.appendChild(aside);
	document.body.appendChild(main);
	LAYOUT.w = data.layout.attr.w || 960;
	LAYOUT.h = data.layout.attr.h - 40 || 540;
	LAYOUT.o = data.layout.attr.orientation;
	LAYOUT.cols = Math.ceil(LAYOUT.w / LAYOUT.grid);
	LAYOUT.rows = Math.ceil(LAYOUT.h / LAYOUT.grid);

	document.body.style.setProperty('--count', data.layout.tabpage.length);

	for (let page of data.layout.tabpage) {
		let sectionHandler = document.createElement('a');
		sectionHandler.textContent = page.attr.name;
		let section = document.createElement('section');
		sectionHandler.addEventListener('click', () => {
			for (let el of aside.childNodes) {
				el.classList.remove('active');
			}
			for (let el of main.childNodes) {
				el.classList.remove('show');
			}
			sectionHandler.classList.add('active');
			section.classList.add('show');
		});
		aside.appendChild(sectionHandler);
		main.appendChild(section);
		sectionHandler.addEventListener('click', () => {});

		for (let control of page.control) {
			let div = document.createElement('div');
			div.classList.add(control.attr.type);
			div.id = control.attr.name;
			// div.setAttribute('data-x', attr.x);
			// div.setAttribute('data-y', attr.y);
			// div.setAttribute('data-w', attr.w);
			// div.setAttribute('data-h', attr.h);
			div.style.setProperty(
				'--x',
				Math.ceil(control.attr.x / LAYOUT.grid + 1) || 1
			);
			div.style.setProperty(
				'--y',
				Math.ceil(control.attr.y / LAYOUT.grid + 1) || 1
			);
			div.style.setProperty(
				'--w',
				Math.ceil(control.attr.w / LAYOUT.grid) || 1
			);
			div.style.setProperty(
				'--h',
				Math.ceil(control.attr.h / LAYOUT.grid) || 1
			);
			div.style.setProperty('--color', `var(--${control.attr.color})`);
			let el = null;
			switch (control.attr.type) {
				case 'push':
					el = document.createElement('input');
					el.type = 'button';
					break;
				case 'toggle':
					el = document.createElement('input');
					el.type = 'checkbox';
					break;
				case 'labelv':
				case 'labelh':
					el = document.createElement('label');
					el.textContent = atob(control.attr.text);
					break;
				case 'led':
					break;
				case 'encoder':
					break;
				case 'faderh':
				case 'faderv':
					el = document.createElement('input');
					el.type = 'range';
					el.min = !control.attr.inverted
						? parseInt(control.attr.scalef) * 10000
						: parseInt(control.attr.scalet) * 10000;
					el.max = !control.attr.inverted
						? parseInt(control.attr.scalet) * 10000
						: parseInt(control.attr.scalef) * 10000;
					if (control.attr.centered) {
						el.value = Math.abs(el.min - el.max) / 2;
					}
					break;
				case 'rotaryh':
				case 'rotaryv':
					break;
				case 'xy':
					break;
				// case 'range':
				// 	el = document.createElement('input');
				// 	el.type = control.type;
				// 	el.min = control?.data?.min || 0;
				// 	el.max = control?.data?.max || 100;
				// 	el.classList.add(control?.data?.orientation);
				// 	break;
				// case 'label':
				// 	el = document.createElement('span');
				// 	el.textContent = control?.data?.value || '';
				// 	break;
			}
			if (el !== null) {
				div.appendChild(el);
				el.addEventListener('change', () => {
					var dataObject = {
						address: `/${page.attr.name}/${control.attr.name}`,
						args: new Array({
							type: 'f',
							value: el.value / 10000,
						}),
					};
					console.log(dataObject);
					dataObject = JSON.stringify(dataObject);
					ws.send(dataObject);
				});
			}
			section.appendChild(div);
		}
	}
	aside.childNodes[0].classList.add('active');
	main.childNodes[0].classList.add('show');
}

function setSize() {
	// const size = `${100 / (LAYOUT.w / LAYOUT.grid)}vw`;
	// const size = '1fr';
	// let rowData = '';

	// for (let i = 0; i < LAYOUT.rows; i++) {
	// 	rowData += ` ${size}`;
	// }

	// let colData = '';
	// for (let i = 0; i < LAYOUT.cols; i++) {
	// 	colData += ` ${size}`;
	// }

	const rowData = `repeat(${LAYOUT.rows}, calc(100% / ${LAYOUT.rows}))`;
	const colData = `repeat(${LAYOUT.cols}, calc(100% / ${LAYOUT.cols}))`;

	document.body.style.setProperty('--grid-rows', rowData);
	document.body.style.setProperty('--grid-columns', colData);
}
