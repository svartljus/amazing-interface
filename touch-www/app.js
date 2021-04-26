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
	console.log(data);
	const aside = document.createElement('aside');
	const main = document.createElement('main');
	document.body.appendChild(aside);
	document.body.appendChild(main);
	LAYOUT.w = data.layout._attributes.w;
	LAYOUT.h = data.layout._attributes.h;
	LAYOUT.o = data.layout._attributes.orientation;
	LAYOUT.cols = LAYOUT.w / LAYOUT.grid;
	LAYOUT.rows = LAYOUT.h / LAYOUT.grid;
	for (let page of data.layout.tabpage) {
		let sectionHandler = document.createElement('a');
		sectionHandler.textContent = page._attributes.name;
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
			const attr = control._attributes;
			let div = document.createElement('div');
			div.style.setProperty('--x', Math.ceil(attr.x / LAYOUT.grid) || 1);
			div.style.setProperty('--y', Math.ceil(attr.y / LAYOUT.grid) || 1);
			div.style.setProperty('--w', Math.ceil(attr.w / LAYOUT.grid) || 1);
			div.style.setProperty('--h', Math.ceil(attr.h / LAYOUT.grid) || 1);
			div.style.setProperty('--color', attr.color);
			div.classList.add(attr.type);
			// let el = null;
			// switch (control.type) {
			// 	case 'button':
			// 		el = document.createElement('button');
			// 		break;
			// 	case 'range':
			// 		el = document.createElement('input');
			// 		el.type = control.type;
			// 		el.min = control?.data?.min || 0;
			// 		el.max = control?.data?.max || 100;
			// 		el.classList.add(control?.data?.orientation);
			// 		break;
			// 	case 'label':
			// 		el = document.createElement('span');
			// 		el.textContent = control?.data?.value || '';
			// 		break;
			// }
			// if (el !== null) div.appendChild(el);
			section.appendChild(div);
		}
	}
	aside.childNodes[0].classList.add('active');
	main.childNodes[0].classList.add('show');
}

function setSize() {
	let size = '1fr'; // `${100 / (LAYOUT.w / LAYOUT.grid)}vw`;
	let rowData = '';
	for (let i = 0; i < LAYOUT.rows; i++) {
		rowData += ` ${size}`;
	}

	let colData = '';
	for (let i = 0; i < LAYOUT.cols; i++) {
		colData += ` ${size}`;
	}

	document.documentElement.style.setProperty('--grid-rows', rowData);
	document.documentElement.style.setProperty('--grid-columns', colData);
}
