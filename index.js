/*
 * @fileOverview
 * @author Will Wen Gunn
 * @version 0.2.7
 */

/*
 * @constructor web
 * @descripttion A simple HTTP, HTTPS and TCP framework for Node.js
 * @see <a href="https://github.com/iwillwen/Web.js">Web.js on Github</a>
 * @Simple Deployment require('webjs').run()
 */
//Modules
var fs = require("fs"),
	mu = require("mustache");

//Metas
var web = exports;
web.version = '0.2.7';
web.mime = require('./lib/mimes').mimes,
			web.metas = {},
			web.servers = [],
			web.httpsServers = [];
//Foundation Server
var http = require('./lib/http'),
	https = require('./lib/https');
//Method
/*
 * @description 设置当前或指定Server的GetRouter
 * @param {Object} _gethandlers 传入的GetRouter*
 * @param {Object} server 可指定Server
 */
web.get = function (_gethandlers, server) {
	var key;
	if (server) {
		//Set to specify server
		for (key in _gethandlers)
			server.getHandlers[key] = _gethandlers[key];
	} else {
		//Default set to current server
		for (key in _gethandlers)
			web.server.getHandlers[key] = _gethandlers[key];
	}
	return this;
};
/*
 * @description Set a PostRouter to current server or specify server. 设置当前或指定的Server的PostRouter
 * @param {Object} _posthandlers A PostRouter(require) 传入的PostRouter*
 * @param {Object} server Specify server 可指定Server
 */
web.post = function (_posthandlers, server) {
	var key;
	if (server) {
		for (key in _posthandlers)
			server.postHandlers[key] = _posthandlers[key];
	} else {
		for (key in _posthandlers)
			web.server.postHandlers[key] = _posthandlers[key];
	}
	return this;
};
/*
 * @description Set a UrlRouter to current server or specify server. 设置当前或指定的Server的PostRouter
 * @param {Object} _posthandlers A UrlRouter or a UrlRule key.(require) 传入的PostRouter或是一个规则的key.*
 * @param {Object} server Specify server or a UrlRule origin. 可指定Server
 */
web.url = function (_urlhandlers, server) {
	var key;
	if (server) {
		if (typeof _urlhandlers == 'object') {
			for (key in _urlhandlers) server.urlHandlers[key] = _urlhandlers[key];
		} else if (typeof _urlhandlers == 'string' && typeof server == 'string') {
			server.urlHandlers[_urlhandlers] = server;
		}
	} else {
		for (key in _urlhandlers)
			web.server.urlHandlers[key] = _urlhandlers[key];
	}
	return this;
};
/*
 * @description Run a HTTP server. 启动HTTP Server的主方法
 * @param {Object} getpath Set a UrlRouter to the server.(require) 传入的URLRouter*
 * @param {Number} port Port to listen.(require) 监听的端口*
 * @param {String} host Domain to listen.(require) 监听的域名*
 * @param {Boolean} backserver if will return the server object or not. 是否返回该Server对象(建议在启动多服务器的时候使用*)
 */
web.run = function (getpath, port, host, backserver) {
	if (http.server == undefined) {
		http.server = http.createHttpServer();
		web.servers.push(http.server);
		web.server = http.server;
		console.log('Create server.');
	} else if (backserver) {
		//Not the first server.
		web.server = http.server = createHttpServer();
		console.log('Create new server.');
	}
	if (getpath == undefined) {
		//Default listen 80 port
		web.server.listen(80);
		web.server.port = 80;
		web.server.host = '127.0.0.1';
		console.log('Server is running on 127.0.0.1:80');
		if (backserver) {
			//Return the server obejct.
			return web.server;
		} else {
	 		return this;
		}
	} else {
		var key;
		for (key in getpath) {
			web.server.urlHandlers[key] = getpath[key];
		}
		if (port !== undefined) {
			if (host === undefined) {
				web.server.listen(port);
			} else {
				web.server.listen(port, host);
				web.server.host = host;
			}
			web.server.port = port;
		}
		if (backserver){
			//Return the server obejct.
			return web.server;
		} else {
			return this;
		}
	}
};
/*
 * @description Run a HTTPS server. 启动HTTP Server的主方法
 * @param {Object} getpath Set a UrlRouter to the server.(require) 传入的URLRouter*
 * @param {Number} port Port to listen.(require) 监听的端口*
 * @param {String} host Domain to listen.(require) 监听的域名*
 * @param {Boolean} backserver if will return the server object or not. 是否返回该Server对象(建议在启动多服务器的时候使用*)
 */
web.runHttps = function (getpath, port, host, backserver) {
	if (https.httpsServer == undefined) {
		https.httpsServer = https.createHttpsServer();
		web.httpsServers.push(https.httpsServer);
		web.httpsServer = https.httpsServer;
	} else 
	if (backserver) {
		https.server = createHttpsServer();
		web.httpsServer = https.server;
		console.log('Create new HTTPS server.');
	}
	if (getpath == undefined) {
		web.httpsServer.listen(80);
		web.server.port = 80;
		web.server.host = '127.0.0.1';
		console.log('Server is running on https://127.0.0.1:80');
		if (backserver) {
			return https.httpsServer;
		} else {
	 		return this;
		}
	} else {
		var key;
		for (key in getpath) {
			web.httpsServer.urlHandlers[key] = getpath[key];
		}
		if (port !== undefined) {
			if (host === undefined) {
				web.httpsServer.listen(port);
			} else {
				web.httpsServer.listen(port, host);
				web.server.host = host;
			}
			web.httpsServer.port = port;
		}
		if (backserver){
			return web.httpsServer;
		} else {
			return this;
		}
	}
};
/*
 * @description Set the custom 404 page. 设置自定义404页面
 * @param {String} path 404 page file's name.(require) 需要设置的文件路径(不包括'/')*
 */
web.set404 = function (path) {
	fs.readFile("./" + path, function (err, data) {
		http.page404 = data;
		https.page404 = data;
	});
	return this;
};
/*
 * @description 设置GET和POST响应错误时的错误响应
 * @param {Object} handlers 传入的ErorrHandlers*
 */
web.erorr = function (handlers) {
	var key;
	for (key in handlers) {
		erorrHandlers[key] = handlers[key];
	}
	return this;
};
/*
 * @description 禁止请求某些文件格式时的响应器
 * @param {Object} handlers 传入的响应器*
 */
web.noMimes = function (handlers) {
	var key;
	for (key in handlers) {
		blockMimes[key] = handlers[key];
	}
	return this;
};
/*
 * @description 设置一些需要用到的元数据
 * @param {String} key 元数据的Key*
 * @param {String} value 元数据的值*
 */
web.set = function (key, value) {
	this.metas[key] = value;
	return this;
};
/*
 * @description 自定义MIME类型
 * @param {String} format 文件格式后缀*
 * @param {String} mime MIME类型*
 */
web.reg = function (format, mime) {
	if (/^\./.test(format)) {
		this.mimes[format.substring(1)] = mime;
	} else {
		this.mimes[format] = mime;
	}
	return this;
};
/*
 * @description 调用Mustache进行模板渲染
 * @param {String} 模板的名称
 * @param {Object} 
 */
web.render = function (tmlpName, obj) {
	var html = fs.readFileSync(web.metas.tmplDir + '/' + tmlpName + '.html').toString();
	console.log(html);
	return mu.to_html(html, obj);
};
//TCP Server
web.net = require('./lib/net');