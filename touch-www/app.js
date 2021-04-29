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
		drawInterface(data);

		window.onload = setSize();
		// window.onresize = setSize();
	};
	xhr.open('GET', url, true);
	xhr.send(null);
}

/* draw interface */

function drawInterface(data) {
	const aside = document.createElement('aside');
	const main = document.createElement('main');
	document.body.appendChild(aside);
	document.body.appendChild(main);
	LAYOUT.w = data.layout._attributes.w || 1000;
	LAYOUT.h = data.layout._attributes.h || 1000;
	LAYOUT.o = data.layout._attributes.orientation;
	LAYOUT.cols = Math.round(LAYOUT.w / LAYOUT.grid);
	LAYOUT.rows = Math.round(LAYOUT.h / LAYOUT.grid);

	if (!Array.isArray(data.layout.tabpage)) {
		data.layout.tabpage = new Array(data.layout.tabpage);
	}

	document.body.style.setProperty('--count', data.layout.tabpage.length);

	for (let page of data.layout.tabpage) {
		let sectionHandler = document.createElement('a');
		sectionHandler.textContent = atob(page._attributes.name);
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

		if (!Array.isArray(page.control)) {
			page.control = new Array(page.control);
		}

		for (let control of page.control) {
			const attr = control._attributes;
			let div = document.createElement('div');
			div.setAttribute('data-x', attr.x);
			div.setAttribute('data-y', attr.y);
			div.setAttribute('data-w', attr.w);
			div.setAttribute('data-h', attr.h);
			div.style.setProperty('--x', Math.ceil(attr.x / LAYOUT.grid) || 1);
			div.style.setProperty('--y', Math.ceil(attr.y / LAYOUT.grid) || 1);
			div.style.setProperty('--w', Math.floor(attr.w / LAYOUT.grid) || 1);
			div.style.setProperty('--h', Math.floor(attr.h / LAYOUT.grid) || 1);
			div.style.setProperty('--color', attr.color);
			div.name = atob(attr.name);
			div.classList.add(attr.type);
			let el = null;
			switch (attr.type) {
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
					el.textContent = atob(attr.text);
					break;
				case 'led':
					break;
				case 'encoder':
					break;
				case 'faderh':
				case 'faderv':
					el = document.createElement('input');
					el.type = 'range';
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
			if (el !== null) div.appendChild(el);
			section.appendChild(div);
		}
	}
	aside.childNodes[0].classList.add('active');
	main.childNodes[0].classList.add('show');
}

function setSize() {
	const size = `${100 / (LAYOUT.w / LAYOUT.grid)}vw`;
	// const size = '1fr';
	let rowData = '';

	for (let i = 0; i < LAYOUT.rows; i++) {
		rowData += ` ${size}`;
	}

	let colData = '';
	for (let i = 0; i < LAYOUT.cols; i++) {
		colData += ` ${size}`;
	}
	console.log(LAYOUT);

	document.documentElement.style.setProperty('--grid-rows', rowData);
	document.documentElement.style.setProperty('--grid-columns', colData);
}
