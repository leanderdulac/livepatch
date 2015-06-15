var stream = require('stream');

global.LivePatch = require('../lib');
global.chai = require('chai');
global.expect = chai.expect;

global.patchJson = function(obj, fn, callback) {
	var all = [];
	var buffer = new stream.PassThrough();

	buffer.end(JSON.stringify(obj));

	buffer.pipe(LivePatch(fn))
	.on('error', function(err) {
		callback(err);
	})
	.on('data', function(data) {
		all.push(data);
	})
	.on('end', function() {
		callback(null, JSON.parse(Buffer.concat(all).toString()));
	});
};

