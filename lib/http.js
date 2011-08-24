/*
 * @class HTTP module
 */
 var http = require("http"),
	fs = require("fs"),
	url = require("url"),
	formidable = require('formidable'),
	router = require('./router'),
	mimes = require('./mimes').mimes,
	util = require('./util');
exports.server;
//404 page
exports.page404 = "Page not found.";
var send404 = function (res) {
		res.send(exports.page404);
	};

/*
 * @function Create a HTTP Server
 */
exports.createHttpServer = function () {
	exports.server = http.createServer(function (req, res) {
			var path = url.parse(req.url).pathname.substring(1);
			//Response
			/*
			 * @description Send a data to client. 发送数据到客户端 
			 * @param {String} data Data to send(require) 发送的数据* 
			 */
			res.send = function (data) {
				this.writeHead(200, {'Content-type' : 'text/html'});
				this.write(data);
				res.end();
				return this;
			};
			/*
			 * @description Send a file to client. 发送指定文件到客户端
			 * @param {String} fileName Specify file name to send.(require) 需要发送的文件的文件名(不包括文件名前端的'/');*
			 */
			res.sendFile = function (fileName) {
				var format = fileName.split('.');
				fs.readFile(fileName, function (err, data) {
					if (err) return send404(res);
					this.charset = mimes[format[format.length - 1]];
					res.writeHead(200, {'Content-Type' : this.charset});
					res.write(data);
					res.end();
				});
			};
			/*
			 * @description Send a JSON String to client. 发送JSON数据到客户端
			 * @param {Array} data A data to send, it can be Array, Object or String.(require) 需要发送的数据，可以是Array, Object或是已经编码的JSON字符串*
			 */
			res.sendJSON = function (data) {
				switch (typeof data) {
					case "string":
						this.charset = "application/json";
						res.writeHead(200, {'Content-Type' : this.charset});
						res.write(data);
						res.end();
						break;
					case "array":
					case "object":
						var sJSON = JSON.stringify(data);
						this.charset = "application/json";
						res.writeHead(200, {'Content-Type' : this.charset});
						res.write(sJSON);
						res.end();
						break;
				}
			};
			/*
			 * @description Send a JSON String to client, and then run the callback. 发送JSONP数据到客户端，然后让客户端执行回调函数。
			 * @param {Array} data A data to send, it can be Array, Object or String.(require) 需要发送的数据，可以是Array, Object或是已经编码的JSON字符串*
			 */
			res.sendJSONP = function (data) {
				switch (typeof data) {
					/*
					 * JSON string data.
					 */
					case "string":
						this.charset = "application/json";
						res.writeHead(200, {'Content-Type' : this.charset});
						res.write(req.qs.callback + '(' + data + ')');
						res.end();
						break;
					/*
					 * Array or Object
					 */
					case "array":
					case "object":
						var sJSON = JSON.stringify(data);
						this.charset = "application/json";
						res.writeHead(200, {'Content-Type' : this.charset});
						res.write(req.qs.callback + '(' + sJSON + ')');
						res.end();
						break;
				}
			};
			/*
			 * @description Redirect the client to specify url ,home, back or refresh. 使客户端重定向到指定域名，或者重定向到首页，返回上一页，刷新。
			 * @param {String} url Specify url ,home, back or refresh.(require) 指定的域名，首页，返回或刷新。*
			 */
			res.redirect = function (url) {
				switch (url) {
					/*
					 * Redirect to home.
					 */
					case 'home':
						res.writeHead(302, {'Location': url.parse(req.url).hostname});
						res.end();
						console.log('Redirected to home');
						break;
					/*
					 * Back to the previous page.
					 */
					case 'back':
						res.send('javascript:history.go(-1)');
						res.writeHead(302, {'Location': 'javascript:history.go(-1)'});
						res.end();
						console.log('Redirected to back');
						break;
					/*
					 * Refresh the client.
					 */
					case 'refresh':
						res.writeHead(302, {'Location': req.url});
						res.end();
						console.log('Refresh the client');
						break;
					/*
					 * Redirected to specify url.
					 */
					default:
						res.writeHead(302, {'Location': url});
						res.end();
						console.log('Refresh to ' + url);
				}
				return this;
			}
			/*
			 * @description Set a cookies on the client. 在客户端设置cookies
			 * @param {String} name name of the cookies.(require) cookies的名字*
			 * @param {String} val content of the cookies.(require) cookies的数据*
			 * @param {Object} options Detail options of the cookies. cookies的详细设置
			 */
			res.cookie = function (name, val, options) {
				options = options || {};
				if ('maxAge' in options) options.expires = new Date(Date.now() + options.maxAge);
				if (undefined === options.path) options.path = url.parse(req.url).hostname;
				var cookie = utils.serializeCookie(name, val, options);
				this.header('Set-Cookie', cookie);
				return this;
			};
			/*
			 * @decription Claer the specify cookies. 清除某指定cookies
			 * @param {String} name Name of the cookies to clear.(require) 需要清除的cookies的名字*
			 * @param {Object} options Detail options of the cookies. 详细设置
			 */
			res.clearCookie = function (name, options) {
				var opts = { expires: new Date(1) };
	
				return this.cookie(name, '', options
					? utils.merge(options, opts)
					: opts);
			};
	
			//Request

			/*
			 * @description Check the Request's MIME type is same to specify MIME type or not. 检测请求的MIME类型是否为指定的MIME类型
			 * @param {String} type The MIME type to check.(require) 需要检测的MIME类型*
			 */
			req.type = function(type) {
				var contentType = this.headers['content-type'];
				if (!contentType) return;
				if (!~type.indexOf('/')) type = mimes[type];
				if (~type.indexOf('*')) {
					type = type.split('/')
					contentType = contentType.split('/');
					if ('*' == type[0] && type[1] == contentType[1]) return true;
					if ('*' == type[1] && type[0] == contentType[0]) return true;
				}
				return !! ~contentType.indexOf(type);
			};
			/*
			 * @description Get the specify header in the request. 返回请求头中的指定数据
			 * @param {String} sHeader Name of the header to get.(require) 需要查询的头数据名*
			 */
			req.header = function (sHeader) {
				if (this.headers[sHeader]) {
					return this.headers[sHeader];
				} else {
					return undefined;
				}
			};
			/*
			 * Use the formidable to parse the post request.
			 */
			if (req.method.toLowerCase() == 'post') {
				var form = new formidable.IncomingForm();
				form.parse(req, function (err, fields, files) {
					req.data = fields;
					for (var key in files) {
						if (files[key].path)
							req.data[key] = fs.readFileSync(files[key].path).toString('utf8');
					}
					router.postHandler(req, res, path, exports.server);
				});
			}
			if (req.method == "GET") router.getHandler(req, res, path, exports.server);
		});
	exports.server.urlHandlers = {};
	exports.server.getHandlers = {};
	exports.server.postHandlers = {};
	exports.server.erorrHandlers = {};
	exports.server.blockMimes = {};
	return exports.server;
};