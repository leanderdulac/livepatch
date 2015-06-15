var stream = require('stream');

describe('Stream', function() {
	describe('when passing JSON without transforms', function() {
		var output = null;
		var object = {
			a: 1,
			b: '2',
			c: true,
			d: {
				x: [{
					alpha: true
				}, {
					beta: false,
					charlie: true
				}, {
					delta: '123'
				}, [[
					0,1,2
				], [
					3,4,5
				]]],
				y: null
			},
			e: ['lol', 'wtf', 'bbq'],
			f: null,
			g: 'g'
		};

		before(function(done) {
			patchJson(object, null, function(err, data) {
				output = data;
				done(err);
			});
		});
		
		it('should output the same object', function() {
			expect(output).to.be.eql(object);
		});
	});

	describe('when streaming an array', function() {
		var output = null;
		var object = [1,2,3,4];
	
		before(function(done) {
			patchJson(object, null, function(err, data) {
				output = data;
				done(err);
			});
		});
		
		it('should output the same object', function() {
			expect(output).to.be.eql(object);
		});
	});

	describe('when parsing malformed JSON', function() {
		before(function(done) {
			var wasDone = false;
			var buffer = new stream.PassThrough();

			buffer.end('dfd');

			buffer.pipe(LivePatch())
			.on('error', function(err) {
				error = err;

				if (!wasDone) {
					done();
					wasDone = true;
				}
			});
		});

		it('should emit an error', function() {
			expect(error).to.be.ok;
		});
	});
});

