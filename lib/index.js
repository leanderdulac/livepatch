var clarinet = require('clarinet');
var stream = require('stream');
var util = require('util');

var quoteRegex = function(str) {
    return (str+'').replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&");
};

var LivePatch = function(fn) {
	if (!(this instanceof LivePatch)) {
		return new LivePatch(fn);
	}

	var self = this;

	stream.Transform.apply(this);

	this.parser = clarinet.parser();
	this.muteLevel = 0;
	this.matches = [];
	this.stack = [];

	this.parser.onerror = function(err) {
		self.emit('error', err);
	};

	this.parser.onkey = function(key) {
		self._pushKey(key);
	};

	this.parser.onvalue = function(value) {
		self._emitValue(value);
	};

	this.parser.onopenobject = function(key) {
		self._startObject();
		self._pushKey(key);
	};

	this.parser.oncloseobject = function() {
		self._closeObject();
	};

	this.parser.onopenarray = function() {
		self._startArray();
	};

	this.parser.onclosearray = function() {
		self._closeArray();
	}

	this._pushKey(null);

	if (fn) {
		fn.apply(this);
	}
};

util.inherits(LivePatch, stream.Transform);

LivePatch.prototype._matches = function(match, m) {
	if (match.path.length != m.path.length) {
		return false;
	}

	for (var i = 0; i < m.path.length; i++) {
		var test = m.path[i];
		var node = match.path[i];

		if (test instanceof RegExp) {
			if (!test.test(node)) {
				return false;
			}
		} else {
			if (node !== test) {
				return false;
			}
		}
	}

	return true;
};

LivePatch.prototype._match = function(type, value) {
	var keys = this.stack.map(function(k) {
		return k.key;
	});

	var match = {
		type: type,
		key: keys[keys.length - 1],
		path: keys,
		value: value
	};

	var result = {};

	for (var i = 0; i < this.matches.length; i++) {
		var m = this.matches[i];

		if (this._matches(match, m)) {
			result = m.fn(match);
			break;
		}
	}

	if (result.rename) {
		match.key = result.rename;
	}

	if (result.remove) {
		match.remove = true;
	}

	if ('value' in result) {
		match.value = result.value;
	}

	return match;
};

LivePatch.prototype._patch = function(type, value) {
	var top = this.stack[this.stack.length - 1];
	var parent = this.stack[this.stack.length - 2];

	if (top.type == 'array') {
		parent = top;
		this._pushKey(parent.counter.toString());
		top =this.stack[this.stack.length - 1];
	}

	top.type = type;

	if (type == 'object' || type == 'array') {
		top.counter = 0;
	}

	if (this.muteLevel > 0) {
		if (type == 'object' || type == 'array') {
			this.muteLevel++;
		} else {
			this.stack.pop();
		}

		return;
	}

	var match = this._match(type, value);

	// Rename if necessary
	top.key = match.key;

	if (match.remove) {
		if (type == 'object' || type == 'array') {
			this.muteLevel++;
		} else {
			this.stack.pop();
		}

		return;
	}

	var start = '', token = '';

	if (parent) {
		if (parent.counter > 0) {
			start = ',';
		}

		if (parent.type == 'object') {
			start += JSON.stringify(top.key) + ':';
		}

		parent.counter++;
	}

	if (type == 'object') {
		token = '{';
	} else if (type == 'array') {
		token = '[';
	} else if (type == 'value') {
		token = JSON.stringify(match.value);
	}

	this.push(start + token);

	if (type == 'value') {
		this.stack.pop();
	}

	return match;
};

LivePatch.prototype._start = function(type) {
	this._patch(type);
};

LivePatch.prototype._close = function(type) {
	var current = this.stack.pop();

	if (this.muteLevel > 0) {
		this.muteLevel--;
	} else {
		if (type == 'object') {
			this.push('}');
		} else if (type == 'array') {
			this.push(']');
		}
	}
};

LivePatch.prototype._emitValue = function(value) {
	this._patch('value', value);
};

LivePatch.prototype._startObject = function() {
	this._start('object');
};

LivePatch.prototype._closeObject = function() {
	this._close('object');
};

LivePatch.prototype._startArray = function() {
	this._start('array');
};

LivePatch.prototype._closeArray = function() {
	this._close('array');
};

LivePatch.prototype._pushKey = function(key) {
	this.stack.push({
		key: key
	});
};

LivePatch.prototype._transform = function(chunk, encoding, callback) {
	this.parser.write(chunk.toString());

	callback();
};

LivePatch.prototype._flush = function(callback) {
	this.parser.onend = function() {
		this.parser.onend = null;

		callback();
	}.bind(this);

	this.parser.close();
};

LivePatch.prototype.rename = function(path, key) {
	this.rewrite(path, function() {
		return {
			rename: key
		};
	});
};

LivePatch.prototype.remove = function(path) {
	this.rewrite(path, function() {
		return {
			remove: true
		};
	});
};

LivePatch.prototype.rewrite = function(pathStr, fn) {
	var path = [];
	var currentLevel = 0, currentCheck = '', acc = '', regex = false, raw = false;

	var flush = function() {
		if (!raw) {
			if (regex) {
				currentCheck += quoteRegex(acc);
			} else {
				currentCheck += acc;
			}
		}

		acc = '';
	};

	var end = function() {
		flush();

		if (regex) {
			path.push(new RegExp('^' + currentCheck + '$'));
		} else {
			path.push(currentCheck);
		}

		currentCheck = '';
		regex = false;
		raw = false;
	};

	for (var i = 0; i < pathStr.length; i++) {
		var c = pathStr[i];

		if (c == '.' || c == '[') {
			end();
		} else if (c == '*') {
			flush();

			if (!regex) {
				currentCheck = quoteRegex(currentCheck);
			}

			currentCheck += '.*';
			regex = true;
		} else if (c == '$') {
			currentCheck = null;
			raw = true;
		} else if (c == ']') {
		} else {
			acc += c;
		}
	}

	end();

	this.matches.push({
		path: path,
		fn: fn
	});
};

module.exports = LivePatch;

