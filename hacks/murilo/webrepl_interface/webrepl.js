var WebREPL = (function (exports) {
    'use strict';

    class EventEmitter {
        constructor() {
            this.events = {};
        }
        on(event, listener) {
            if (typeof this.events[event] !== 'object') {
                this.events[event] = [];
            }
            this.events[event].push(listener);
        }
        removeListener(event, listener) {
            let idx;
            if (typeof this.events[event] === 'object') {
                idx = this.events[event].indexOf(listener);
                if (idx > -1) {
                    this.events[event].splice(idx, 1);
                }
            }
        }
        removeAllListeners(event) {
            if (typeof this.events[event] === 'object') {
                this.events[event] = [];
            }
        }
        emit(event, ...args) {
            let i;
            let listeners;
            let length;
            if (typeof this.events[event] === 'object') {
                listeners = this.events[event].slice();
                length = listeners.length;
                for (i = 0; i < length; i += 1) {
                    listeners[i].apply(this, args);
                }
            }
        }
        once(event, listener) {
            this.on(event, function g(...args) {
                this.removeListener(event, g);
                listener.apply(this, args);
            });
        }
    }

    /**
     * WebSocket connection is opened.
     * @event WebREPL#connected
     */
    /**
     * WebSocket connection is closed.
     * @event WebREPL#disconnected
     */
    /**
     * Incoming WebSocket connection error or internal WebREPL error.
     * @event WebREPL#error
     * @type {ErrorEvent}
     */
    /**
     * WebREPL authenticated session with success.
     * @event WebREPL#authenticated
     */
    /**
     * Every message coming from the webrepl to be printed on the terminal.
     * @event WebREPL#output
     * @type {string}
     */
    /**
     * `ArrayBuffer` coming from the webrepl.
     * @event WebREPL#data
     * @type {ArrayBuffer}
     */

    class WebREPL extends EventEmitter {
        /**
         * Represents a WebREPL connection.
         * @constructor
         * @param {object} [opts] - Initialization option
         * @param {string} [opts.ip] - Ip address to connect to.
         * @param {string} [opts.password] - Password to authenticate webrepl session.
         * @param {boolean} [opts.autoConnect] - Flags if should connect automatically when instantiating WebREPL class.
         * @param {boolean} [opts.autoAuth] - Flags if should authenticate the webrepl session automatically.
         * @param {number} [opts.timeout] - How long, in milliseconds, should wait for response from webrepl.
         * @property {string} [ip='192.168.4.1'] - Ip address to connect to.
         * @property {string} [password='micropythoN'] - Password to authenticate webrepl session.
         * @property {boolean} [autoConnect=false] - Flags if should connect automatically when instantiating WebREPL class.
         * @property {boolean} [autoAuth=false] - Flags if should authenticate the webrepl session automatically.
         * @property {number} [timeout=5000] - How long, in milliseconds, should wait for response from webrepl.
         * @property {Uint8Array} fileBuffer - Buffer for files being requested by `loadFile`.
         * @property {WebSocket} ws - WebSocket connection with board.
         * @example
         * let repl = new WebREPL({
         *     ip: '192.168.1.4',
         *     password: 'micropythoN',
         *     autoConnect: true,
         *     autoAuth: true,
         *     timeout: 5000
         * })
         */
        constructor(opts) {
            super();

            this.STOP = '\r\x03'; // CTRL-C
            this.RESET = '\r\x04'; // CTRL-D
            this.ENTER_RAW_REPL = '\r\x01'; // CTRL-A
            this.EXECUTE_RAW_REPL = '\r\x04'; // CTRL-D
            this.EXIT_RAW_REPL = '\r\x02'; // CTRL-B

            opts = opts || {};
            this.ip = opts.ip || '192.168.4.1';
            this.password = opts.password || 'micropythoN';
            this.autoAuth = !!opts.autoAuth;
            this.autoConnect = !!opts.autoConnect;
            this.timeout = opts.timeout || 5000;

            this.fileBuffer = new Uint8Array();

            if (this.autoConnect) {
                this.connect();
            }
        }

        /**
         * Creates a websocket connection following the WebREPL standards on the
         * ip set while instantiating `WebREPL` and binds events for its opening
         * and for parsing incoming messages.
         * @example
         * let repl = new WebREPL()
         * repl.connect()
         */
        connect() {
            try {
                this.ws = new WebSocket(`ws://${this.ip}:8266`);
                this.ws.binaryType = 'arraybuffer';
                this.ws.onopen = this._onOpen.bind(this);
                this.ws.onerror = this._onError.bind(this);
                this.ws.onclose = this._onClose.bind(this);
            } catch(err) {
                this._onError(err);
            }
        }

        _onOpen() {
            this.emit('connected');
            this.ws.onmessage = this._handleMessage.bind(this);
        }
        _onError(err) {
            this.emit('error', err);
        }
        _onClose() {
            this.emit('disconnected');
        }

        /**
         * Close the current websocket connection.
         * @example
         * let repl = new WebREPL()
         * repl.disconnect()
         */
        disconnect() {
            this.ws.close();
        }

        /**
         * Sends a keyboard interrupt character (CTRL-C).
         * @example
         * let repl = new WebREPL({ autoConnect: true })
         * let stopButton = document.querySelector('#stop-code')
         * repl.on('authenticated', () => {
         *     stopButton.addEventListener('click', repl.sendStop.bind(repl))
         * })
         */
        sendStop() {
            this.eval(this.STOP);
        }

        /**
         * Sends a keyboard interruption (sendStop) and then the character to
         * perform a software reset on the board (CTRL-D).
         * @example
         * let repl = new WebREPL({ autoConnect: true })
         * let resetButton = document.querySelector('#reset-button')
         * repl.on('authenticated', function() {
         *     resetButton.addEventListener('click', (e) => repl.softReset())
         * })
         */
        softReset() {
            this.sendStop();
            this.eval(this.RESET);
        }

        /**
         * Sends character to enter RAW Repl mode (CTRL-A).
         * @return {Promise} - Resolves when board enters in raw repl mode, rejects if timeout.
         * @example
         * let repl = new WebREPL({ autoConnect: true })
         * repl.on('authenticated', function() {
         *     repl.enterRawRepl()
         *         .then(() => {
         *             // RAW REPL
         *         })
         *     })
         * })
         */
        enterRawRepl() {
            return new Promise((resolve, reject) => {
                let timeout = setTimeout(() => {
                    reject(new Error('Timeout: Could not enter raw repl mode.'));
                }, this.timeout);
                let onOutput = (output) => {
                    if (output.indexOf('raw REPL; CTRL-B to exit') != -1) {
                        this.removeListener('output', onOutput);
                        resolve();
                    }
                };
                this.on('output', onOutput);
                this.eval(this.ENTER_RAW_REPL);
            })
        }

        /**
         * Evaluate the code on raw repl line by line and resolve promise when it
         * gets executed (prints "OK"). If `interval` is passed, wait that amount
         * of time before evaluating next line (important for ESP32 WebREPL).
         * @param {string} code - String containing lines of code separated by `\n`.
         * @param {number} interval - Interval in milliseconds between the lines of code.
         * @return {Promise} Resolves when code is pasted and executed (got `OK` from repl) on raw repl mode.
         * @example
         * let repl = new WebREPL({ autoConnect: true })
         * let code = `for i in range(0, 10):\n    print(i)`
         * repl.on('authenticated', function() {
         *     this.enterRawRepl()
         *         .then(() => this.execRaw(code, 30))
         *         .then(() => this.exitRawRepl(code))
         * })
         */
        execRaw(code, interval) {
            return new Promise((resolve, reject) => {
                let onOutput = (output) => {
                    if (output.indexOf('OK') != -1) {
                        this.removeListener('output', onOutput);
                        resolve();
                    }
                };
                this.on('output', onOutput);
                if(interval) {
                    code.split('\n').forEach((line, i) => {
                        setTimeout(() => {
                            this.eval(`${line}\r`);
                            this.emit('output', '.');
                        }, i*interval);
                    });
                    setTimeout(() => {
                        this.eval(this.EXECUTE_RAW_REPL);
                    }, (code.split('\n').length + 1) * interval );
                } else {
                    this.eval(code);
                    this.eval(this.EXECUTE_RAW_REPL);
                }
            })
        }

        /**
         * Sends character to enter RAW Repl mode (CTRL-D + CTRL-B).
         * @return {Promise} Resolves when exits raw repl mode (Gets MicroPython booting message).
         * @example
         * let repl = new WebREPL({ autoConnect: true })
         * repl.on('authenticated', function() {
         *     repl.enterRawRepl()
         *         .then(() => repl.execRaw('print("hello world!")'))
         *         .then(() => repl.exitRawRepl())
         * })
         */
        exitRawRepl() {
            return new Promise((resolve, reject) => {
                let onOutput = (output) => {
                    let endRaw = 'Type "help()" for more information.';
                    if (output.indexOf(endRaw) != -1) {
                        this.removeListener('output', onOutput);
                        resolve();
                    }
                };
                this.on('output', onOutput);
                this.eval(this.EXIT_RAW_REPL);
            })
        }

        /**
         * Execute a string containing lines of code separated by `\n` in raw repl
         * mode. It will send a keyboard interrupt before entering RAW REPL mode.
         * @param {string} code - String containing lines of code separated by `\n`.
         * @param {number} interval - Interval in milliseconds between the lines of code.
         * @return {Promise} Resolves when exits raw repl mode.
         * @example
         * let repl = new WebREPL({ autoConnect: true })
         * let code = `for i in range(0, 10):\n    print(i)`
         * repl.on('authenticated', function() {
         *     this.execFromString(code)
         *         .then(() => console.log('code executed'))
         *
         * })
         */
        execFromString(code, interval) {
            this.sendStop();
            return this.enterRawRepl()
                .then(() => this.execRaw(code, interval))
                .then(() => this.exitRawRepl())
        }

        /**
         * Send command to websocket connection.
         * @param {string} command - Command to be sent.
         * @example
         * let repl = new WebREPL({ autoConnect: true })
         * repl.on('authenticated', function() {
         *     this.eval('print("hello world!")\r')
         * })
         */
        eval(command) {
            this.ws.send(command);
        }

        /**
         * Evaluate command to the board followed by a line break (\r).
         * @param {string} command - Command to be executed by WebREPL.
         * @example
         * let repl = new WebREPL({ autoConnect: true })
         * repl.on('authenticated', function() {
         *     repl.exec('print("hello world!")')
         * })
         */
        exec(command) {
            this.eval(command + '\r');
        }

        /**
         * Save file to MicroPython's filesystem. Will use the filename from the
         * `file` argument object as the filesystem path.
         * @param {string} filename - Name of file to be sent
         * @param {Uint8Array} putFileData - Typed array buffer with content of file to be sent.
         * @return {Promise} Resolves when file is sent.
         * @example
         * let repl = new WebREPL({ autoConnect: true })
         * let filename = 'foo.py'
         * let buffer = new TextEncoder("utf-8").encode('print("hello world!")');
         * repl.on('authenticated', function() {
         *     repl.sendFile(filename, buffer)
         * })
         */
        sendFile(filename, putFileData) {
            return new Promise((resolve, reject) => {
                let timeout = setTimeout(() => {
                    reject(new Error('Timeout: Could not send file.'));
                }, this.timeout);
                let initialResponse = (data) => {
                    clearTimeout(timeout);
                    let response = new Uint8Array(data);
                    if (this._decode_response(response) == 0) {
                        this.removeListener('data', initialResponse);
                        // Register listener for final response
                        this.on('data', finalResponse);
                        // Send file in chunks
                        for (let offset = 0; offset < putFileData.length; offset += 1024) {
                            this.ws.send(putFileData.slice(offset, offset + 1024));
                        }
                    }
                };
                let finalResponse = (data) => {
                    let response = new Uint8Array(data);
                    if (this._decode_response(response) == 0) {
                        this.removeListener('data', finalResponse);
                        resolve();
                    }
                };
                // Register listener for initial response
                this.on('data', initialResponse);
                // Send request to open file
                let rec = this._getPutBinary(filename, putFileData.length);
                this.ws.send(rec);
            })
        }

        /*
         * Given a filename and the file size, get a `Uint8Array` with fixed length
         * and specific bits set to send a "put" request to MicroPython.
         * @param {string} filename - File name
         * @param {number} filesize - Length of ArrayBuffer containing file data
         * @returns {Uint8Array}
         */
        _getPutBinary(filename, filesize) {
            // WEBREPL_FILE = "<2sBBQLH64s"
            let rec = new Uint8Array(2 + 1 + 1 + 8 + 4 + 2 + 64);
            rec[0] = 'W'.charCodeAt(0);
            rec[1] = 'A'.charCodeAt(0);
            rec[2] = 1; // put
            rec[3] = 0;
            rec[4] = 0; rec[5] = 0; rec[6] = 0; rec[7] = 0; rec[8] = 0; rec[9] = 0; rec[10] = 0; rec[11] = 0;
            rec[12] = filesize & 0xff; rec[13] = (filesize >> 8) & 0xff; rec[14] = (filesize >> 16) & 0xff; rec[15] = (filesize >> 24) & 0xff;
            rec[16] = filename.length & 0xff; rec[17] = (filename.length >> 8) & 0xff;
            for (let i = 0; i < 64; ++i) {
                if (i < filename.length) {
                    rec[18 + i] = filename.charCodeAt(i);
                } else {
                    rec[18 + i] = 0;
                }
            }
            return rec
        }

        /**
         * Load file from MicroPython's filesystem.
         * @param {string} filename - File name
         * @return {Promise} Resolves with `Uint8Array` containing the data from requested file.
         * @example
         * let repl = new WebREPL({ autoConnect: true })
         * let filename = 'foo.py'
         * repl.saveAs = (blob) => {
         *     console.log('File content', blob)
         * }
         * repl.loadFile(filename)
         */
        loadFile(filename) {
            return new Promise((resolve, reject) => {
                this.fileBuffer = new Uint8Array();
                let timeout = setTimeout(() => {
                    reject(new Error('Timeout: Could not get file.'));
                }, this.timeout);
                let initialResponse = (data) => {
                    let response = new Uint8Array(data);
                    if (this._decode_response(response) == 0) {
                        this.removeListener('data', initialResponse);
                        this.on('data', onFileData);
                        let nextRec = new Uint8Array(1);
                        nextRec[0] = 0;
                        this.ws.send(nextRec);
                    }
                };
                let onFileData = (data) => {
                    let response = new Uint8Array(data);
                    var sz = response[0] | (response[1] << 8);
                    if (response.length == 2 + sz) {
                        // we assume that the data comes in single chunks
                        if (sz != 0) {
                            // accumulate incoming data to fileBuffer
                            let newBuffer = new Uint8Array(this.fileBuffer.length + sz);
                            newBuffer.set(this.fileBuffer);
                            newBuffer.set(response.slice(2), this.fileBuffer.length);
                            this.fileBuffer = newBuffer;
                            let rec = new Uint8Array(1);
                            rec[0] = 0;
                            this.ws.send(rec);
                        }
                    } else {
                        // Done receiving
                        this.removeListener('data', onFileData);
                        resolve(this.fileBuffer);
                    }
                };
                let rec = this._getGetBinary(filename);
                this.on('data', initialResponse);
                this.ws.send(rec);
            })
        }

        /*
         * Given a filename, get a `Uint8Array` with fixed length and specific bits
         * set to send a "get" request to MicroPython.
         * @param {string} filename - File name
         * @returns {Uint8Array}
         */
        _getGetBinary(filename) {
            // WEBREPL_FILE = "<2sBBQLH64s"
            let rec = new Uint8Array(2 + 1 + 1 + 8 + 4 + 2 + 64);
            rec[0] = 'W'.charCodeAt(0);
            rec[1] = 'A'.charCodeAt(0);
            rec[2] = 2; // get
            rec[3] = 0;
            rec[4] = 0; rec[5] = 0; rec[6] = 0; rec[7] = 0; rec[8] = 0; rec[9] = 0; rec[10] = 0; rec[11] = 0;
            rec[12] = 0; rec[13] = 0; rec[14] = 0; rec[15] = 0;
            rec[16] = filename.length & 0xff; rec[17] = (filename.length >> 8) & 0xff;
            for (let i = 0; i < 64; ++i) {
                if (i < filename.length) {
                    rec[18 + i] = filename.charCodeAt(i);
                } else {
                    rec[18 + i] = 0;
                }
            }
            return rec
        }

        /*
         * Makes sure incoming data is valid.
         * @param {ArrayBuffer} - Incoming data from webrepl.
         * @return {number} Returns `0` if valid and `-1` otherwise.
         */
        _decode_response(data) {
            if (data[0] == 'W'.charCodeAt(0) && data[1] == 'B'.charCodeAt(0)) {
                var code = data[2] | (data[3] << 8);
                return code;
            } else {
                return -1;
            }
        }

        /*
         * Handles incoming data from websocket based on the data and current
         * binaryState the WebREPL currently is set to.
         * @param {object} event - Incoming event object from websocket connection.
         * @param {ArrayBuffer|String} event.data - Data sent by MicroPython
         * through websocket.
         */
        _handleMessage(event) {
            if (event.data instanceof ArrayBuffer) {
                this.emit('data', event.data);
            } else if (typeof event.data === 'string') {
                this.emit('output', event.data);
                // If is asking for password, send password
                if (event.data == 'Password: ' && this.autoAuth) {
                    this.ws.send(`${this.password}\r`);
                }
                if (event.data.indexOf('WebREPL connected') != -1) {
                    this.emit('authenticated');
                }
            } else {
                this._onError(new Error('Unrecognized data format.'));
            }
        }
    }

    exports.default = WebREPL;
    exports.WebREPL = WebREPL;

    return exports;

}({}));
