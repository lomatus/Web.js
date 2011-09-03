/*
 * @class Server router module
 */
var fs = require('fs'),
	url = require('url'),
	mimes = require('./mimes');
exports.page404 = "Page not found.";
var send404 = function (res) {
		res.send(exports.page404);
	};
/*
 * @description Get Method Router
 * @param {Object} req Request
 * @param {Object} res Response
 * @param {String} getpath Get Url
 * @param {Object} server Server object
 */
exports.getHandler = function (req, res, getpath, server) {
		switch (getpath) {
			//Index
			case "":
				if ("/" in server.urlHandlers) {
					res.sendFile(server.urlHandlers["/"]);
				} else if ("/" in server.getHandlers) {
					server.getHandlers["/"](req, res);
				} else {
					res.sendFile("index.html");
				}
				break;
			//Favicon Icon
			case "favicon.ico":
				res.sendFile("favicon.ico");
				break;
			//Default static get or Url router
			default:
				for (var key in server.getHandlers) {
					var _key = key.replace(/\/:([a-zA-Z0-9-_$]*)/g, '\\/(.*)');
					if (/\//.test(_key)) _key = _key.substring(2);
					var uhReg = new RegExp(_key, "i");
					if (uhReg.test(getpath)) {
						//Replace the RESTful key
						var $key = key,
							keys = [];
						for (var i = 1;i < 10;i++) {
							if (/\/:([a-zA-Z0-9-_.$]*)/i.test($key)) {
								keys.push(RegExp['$1']);
								$key = $key.replace(/\/:([a-zA-Z0-9-_.$]*)/i, '\\/(.*)');
							} else {
								break;
							}
						}
						try {
							req.path = {};
							req.qs = url.parse(req.url, true).query;
							uhReg.test(getpath);
							//Fetch the RESTful key
							for (var i = 1;i < 10;i++)
								if (RegExp['$' + i] !== '')
									req.path[keys[i - 1]] = RegExp['$' + i];
							//Run the handler
							server.getHandlers[key](req, res);
						} catch(ex) {
							//Get handler go wrong
							if (server.errorHandler.get) {
								return server.erorrHandlers.get(req, res, ex);
							} else {
								return send404(res);
							}
						}
						return;
					}
				}
				//No any get rules match, find in url rules
				exports.urlHandler(req, res, getpath, server);
		}
	},
	/*
	 * @description Url Router
	 * @param {Object} req Request
	 * @param {Object} res Response
	 * @param {String} getpath Get Url
	 * @param {Object} server Server object
	 */
	exports.urlHandler = function (req, res, getpath, server) {
		var scriptfile;
		for (var key in server.urlHandlers) {
			//Replace the RESTful key
			var _key = key.replace(/\/:([a-zA-Z0-9-_$]*)/g, '\\/(.*)');
			if (/\//.test(_key)) _key = _key.substring(2);
			var uhReg = new RegExp(_key, "i");
			if (uhReg.test(getpath)) {
				scriptfile = server.urlHandlers[key];
				var _keys = [];
				//Replace the params to key
				for (var i = 1; i < 10;i++)
					if (RegExp['$' + i] !== '')
						scriptfile = scriptfile.replace('$' + i, RegExp['$' + i]);
				break;
			}
		}
		//Redirect to specify url
		if (/^http/.test(scriptfile)) {
			res.writeHead(302, {'Location': scriptfile});
			res.end();
			console.log('Redirected to ' + scriptfile);
			return;
		}
		//finded a match url rule
		if (scriptfile !== undefined) {
			fs.readFile(scriptfile, function (err, data) {
				if (err) return send404(res);
				var format = scriptfile.split(".");
				res.writeHead(200, {'Content-Type': mimes[format[format.length -1]]});
				res.write(data, 'utf8');
				res.end();
			});
		} else {
			//static resources
			exports.fileHandler(req, res, getpath, server);
		}
	},
	/*
	 * @description Post method router
	 * @param {Object} req Request
	 * @param {Object} res Response
	 * @param {String} getpath Post Url
	 * @param {Object} server Server object
	 */
	exports.postHandler = function (req, res, postpath, server) {
		for (var key in server.postHandlers) {
			//Replace the RESTful key
			var _key = key.replace(/\/:([a-zA-Z0-9-._$]*)/g, '\\/(.*)');
			if (/\//.test(_key)) _key = _key.substring(2);
			var $key = key,
				uhReg = new RegExp(_key, "i"),
				keys = [];
			for (var i = 1;i < 10;i++) {
				//Replace the params to key
				if (/\/:([a-zA-Z0-9-_.$]*)/i.test($key)) {
					keys.push(RegExp['$1']);
					$key = $key.replace(/\/:([a-zA-Z0-9-_.$]*)/i, '\\/(.*)');
				} else {
					break;
				}
			}
			if (uhReg.test(postpath)) {
				try {
					var pathReg = {};
					//Replace the params to key
					for (var i = 1;i < 10;i++)
						if (RegExp['$' + i] !== '')
							pathReg[keys[i - 1]] = RegExp['$' + i];
					res.writeHead(200, {'Content-type':'text/html'});
					req.path = pathReg;
					//Run the handler
					server.postHandlers[key](req, res);
				} catch(ex) {
					//Post handler go wrong
					if (server.erorrHandlers.post) {
						return server.erorrHandlers.post(req, res, ex);
					} else {
						return send404(res);
					}
				}
			}
		}
	},
	 /*
	 * @description Static resources sender
	 * @param {Object} req Request
	 * @param {Object} res Response
	 * @param {String} getpath Get Url
	 * @param {Object} server Server object
	 */
	exports.fileHandler = function (req, res, getpath, server) {
		var format = getpath.split('.');
		if (format[format.length - 1] in server.blockMimes) {
			//Blocked the file format
			server.blockMimes[format[format.length - 1]](req, res);
		} else {
			if (format.length == 1) {
				//SubDir
				if (/.\//.test(getpath)) {
					res.sendFile(getpath + 'index.html');
				} else {
					res.sendFile(getpath + '/index.html');
				}
			} else {
				//static resources
				res.sendFile(getpath);
			}
		}
	};