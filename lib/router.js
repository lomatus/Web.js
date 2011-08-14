var fs = require('fs'),
	url = require('url'),
	mimes = require('./mimes');
exports.page404 = "Page not found.";
var send404 = function (res) {
		res.send(exports.page404);
	};
exports.getHandler = function (req, res, getpath, server) {
		switch (getpath) {
			case "":
				if ("/" in server.urlHandlers) {
					res.sendFile(server.urlHandlers["/"]);
				} else if ("/" in server.getHandlers) {
					server.getHandlers["/"](req, res);
				} else {
					res.sendFile("index.html");
				}
				break;
			case "favicon.ico":
				res.sendFile("favicon.ico");
				break;
			default:
				for (var key in server.getHandlers) {
					var _key = key.replace(/\/:([a-zA-Z0-9-_$]*)/g, '\\/(.*)');
					if (/\//.test(_key)) _key = _key.substring(2);
					var uhReg = new RegExp(_key, "i");
					if (uhReg.test(getpath)) {
						for (var i = 1;i < 10;i++) {
							var $key = key,
								keys = [];
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
							for (var i = 1;i < 10;i++) {
								if (RegExp['$' + i] !== '') {
									req.path[keys[i - 1]] = RegExp['$' + i];
								}
							}
							res.writeHead(200, {'Content-type' : 'text/html'});
							server.getHandlers[key](req, res);
						} catch(ex) {
							if (server.errorHandler.get !== undefined) {
								return server.erorrHandlers.get(req, res);
							} else {
								return send404(res);
							}
						}
						return;
					}
				}
				exports.urlHandler(req, res, getpath, server);
		}
	},
	exports.urlHandler = function (req, res, getpath, server) {
		var scriptfile;
		for (var key in server.urlHandlers) {
			var _key = key.replace(/\/:([a-zA-Z0-9-._$]*)/g, '\\/(.*)');
			if (/\//.test(_key)) _key = _key.substring(2);
			var uhReg = new RegExp(_key, "i");
			if (uhReg.test(getpath)) {
				scriptfile = server.urlHandlers[key];
				var _keys = [];
				for (var i = 1; i < 10;i++) {
					if (RegExp['$' + i] !== '') {
						scriptfile = scriptfile.replace('$' + j, RegExp['$' + i]);
					}
				}
				break;
			}
		}
		if (/^http/.test(scriptfile)) {
			res.writeHead(302, {'Location':scriptfile});
			res.end();
			console.log('Redirected to ' + scriptfile);
			return;
		}
		if (scriptfile !== undefined) {
			fs.readFile(scriptfile, function (err, data) {
				if (err) return send404(res);
				var format = scriptfile.split(".");
				res.writeHead(200, {'Content-Type': mimes[format[format.length -1]]});
				res.write(data, 'utf8');
				res.end();
			});
		} else {
			exports.fileHandler(req, res, getpath, server);
		}
	},
	exports.postHandler = function (req, res, postpath, server) {
		for (var key in server.postHandlers) {
			var _key = key.replace(/\/:([a-zA-Z0-9-._$]*)/g, '\\/(.*)');
			if (/\//.test(_key)) _key = _key.substring(2);
			var $key = key,
				uhReg = new RegExp(_key, "i"),
				keys = [];
			for (var i = 1;i < 10;i++) {
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
					for (var i = 1;i < 10;i++)
					{
						if (RegExp['$' + i] !== '') {
							pathReg[keys[i - 1]] = RegExp['$' + i];
						}
					}
					res.writeHead(200, {'Content-type':'text/plain'});
					req.path = pathReg;
					server.postHandlers[key](req, res);
				} catch(ex) {
					if (server.erorrHandlers.post !== undefined) {
						return server.erorrHandlers.post(req, res);
					} else {
						return send404(res);
					}
				}
			}
		}
	},
	exports.fileHandler = function (req, res, getpath, server) {
		var format = getpath.split('.');
		if (format[format.length - 1] in server.blockMimes) {
			server.blockMimes[format[format.length - 1]](req, res);
		} else {
			if (format.length == 1) {
				if (/.\//.test(getpath)) {
					res.sendFile(getpath + 'index.html');
				} else {
					res.sendFile(getpath + '/index.html');
				}
			} else {
				res.sendFile(getpath);
			}
		}
	};