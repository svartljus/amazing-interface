const LAYOUT = {};
LAYOUT.grid = 20;

window.addEventListener('load', () => {
	loadZipFile('assets/touch/sample.touchosc');
});

function parseXml(xmlStr) {
	console.log('parsing xml', xmlStr)
	data = xml2js(xmlStr, { compact: true, spaces: 4 });
	tidy(data);
	console.log('parsed json', data);
	drawInterface(data);
	window.onload = setSize();
}

function loadZipFile(url) {
	fetch(url)
		.then(r => r.arrayBuffer())
		.then(buffer => {
			const bytebuffer = new Uint8Array(buffer)
			const unzipper = new fflate.Unzip()
			unzipper.register(fflate.UnzipInflate);
			unzipper.onfile = file => {
				console.log('unzipper found a file', file)
				if (file.name === 'index.xml') {
					let xmlbytes = new Uint8Array()
					file.ondata = (err, data, final) => {
						let newxmlbytes = new Uint8Array( xmlbytes.length + data.length )
						newxmlbytes.set(xmlbytes, 0)
						newxmlbytes.set(data, xmlbytes.length)
						xmlbytes = newxmlbytes
						if (final) {
							const td = new TextDecoder()
							const xmltext = td.decode(xmlbytes)
							parseXml(xmltext)
						}
					}
					file.start()
				}
			}
			unzipper.push(bytebuffer, true)
		})
}

/* load XML */
function loadFile(url, callback) {
	var xhr = new XMLHttpRequest();
	xhr.arguments = Array.prototype.slice.call(arguments, 2);
	xhr.onload = () => {
		const serializer = new XMLSerializer();
		const dom = xhr.responseXML.documentElement;
		const xmlStr = serializer.serializeToString(dom);
		parseXml(xmlStr)
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
			control.attr.addr = `/${page.attr.name}/${control.attr.name}`;
			delete control._attributes;
			for (const [key, value] of Object.entries(control.attr)) {
				if (value === 'false') control.attr[key] = false;
				if (value === 'true') control.attr[key] = true;
			}
		}
	}
}

function drawInterface(data) {
	const aside = document.createElement('aside');
	const main = document.createElement('main');
	const fscale = 10000;
	document.body.appendChild(aside);
	document.body.appendChild(main);
	LAYOUT.w = data.layout.attr.w || 960;
	LAYOUT.h = data.layout.attr.h - 40 || 540;
	LAYOUT.o = data.layout.attr.orientation;
	LAYOUT.cols = Math.ceil(LAYOUT.w / LAYOUT.grid);
	LAYOUT.rows = Math.ceil(LAYOUT.h / LAYOUT.grid);

	if (data.layout.tabpage.length !== 1)
		document.body.classList.add('multi-page');
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
			const div = $('div', control.attr.type, control.attr.name);
			div.style.setProperty('--x', Math.ceil(control.attr.x / LAYOUT.grid + 1));
			div.style.setProperty('--y', Math.ceil(control.attr.y / LAYOUT.grid + 1));
			div.style.setProperty('--w', Math.ceil(control.attr.w / LAYOUT.grid));
			div.style.setProperty('--h', Math.ceil(control.attr.h / LAYOUT.grid));
			div.style.setProperty('--color', `var(--${control.attr.color})`);
			let el = null;
			switch (control.attr.type) {
				case 'push':
					el = document.createElement('input');
					el.type = 'button';
					el.onclick = () => {
						send({
							address: control.attr.addr,
							args: new Array({
								type: 'f',
								value: 1.0,
							}),
						});
					};
					break;
				case 'toggle':
					el = document.createElement('input');
					el.type = 'checkbox';
					el.onclick = () => {
						send(getDataObject(control.attr.addr, 'f', el.value));
					};
					break;
				case 'labelv':
				case 'labelh':
					div.textContent = atob(control.attr.text);
					break;
				case 'faderh':
				case 'faderv':
					el = document.createElement('input');
					el.type = 'range';
					el.min = !control.attr.inverted
						? parseInt(control.attr.scalef) * fscale
						: parseInt(control.attr.scalet) * fscale;
					el.max = !control.attr.inverted
						? parseInt(control.attr.scalet) * fscale
						: parseInt(control.attr.scalef) * fscale;
					if (control.attr.centered) {
						el.value = Math.abs(el.min - el.max) / 2;
					}
					el.addEventListener('input', () => {
						let val = el.value / fscale;
						div.style.setProperty('--val', val);
						send(getDataObject(control.attr.addr, 'f', val));
					});
					// if (control.attr.type === 'faderv') {
					// 	const sy =
					// 		(LAYOUT.rows / LAYOUT.cols) * (control.attr.w / control.attr.h);
					// 	const sx =
					// 		(LAYOUT.cols / LAYOUT.rows) * (control.attr.h / control.attr.w);
					// 	el.style.transform = `rotate(-90deg) scale(${sx}, ${sy})`;
					// }
					break;
			}
			if (el !== null) div.appendChild(el);
			section.appendChild(div);
		}
	}
	aside.childNodes[0].classList.add('active');
	main.childNodes[0].classList.add('show');

	const grid = document.createElement('section');
	grid.id = 'grid';
	for (let x = 0; x < LAYOUT.rows; x++) {
		for (let y = 0; y < LAYOUT.cols; y++) {
			const cell = document.createElement('div');
			grid.appendChild(cell);
		}
	}
	main.appendChild(grid);
}

function getDataObject(addr, type, val) {
	return {
		address: addr,
		args: new Array({
			type: type,
			value: val,
		}),
	};
}

function send(data) {
	console.log(data);
	data = JSON.stringify(data);
	ws.send(data);
}

function setSize() {
	const rowData = `repeat(${LAYOUT.rows}, calc(100% / ${LAYOUT.rows}))`;
	const colData = `repeat(${LAYOUT.cols}, calc(100% / ${LAYOUT.cols}))`;
	document.body.style.setProperty('--grid-rows', rowData);
	document.body.style.setProperty('--grid-columns', colData);
}

function $(type = 'div', className, id) {
	const el = document.createElement(type);
	el.className = className;
	el.id = id;
	return el;
}
