
describe('Rewrite', function() {
	describe('when using deep paths', function() {
		var output = null;
		var object = {
			safe: true,
			arr: [{
				metadata_123: 'wtf',
				safe: true,
				deep: {
					so: {
						deep: {
							that: {
								i: {
									can: [{
										see: {
											adele: {
												rolling: {
													in: {
														it: {
															metadata_test: 123
														}
													}
												}
											}
										}
									}]
								}
							}
						}
					}
				}
			}, {
				metadata_456: 'bbq',
				safe: true
			}]
		};

		before(function(done) {
			patchJson(object, function() {
				this.rename('$..metadata_*', 'metadata');
			}, function(err, data) {
				output = data;
				done(err);
			});
		});

		it('should change the correct values', function() {
			expect(output).to.eql({
				safe: true,
				arr: [{
					metadata: 'wtf',
					safe: true,
					deep: {
						so: {
							deep: {
								that: {
									i: {
										can: [{
											see: {
												adele: {
													rolling: {
														in: {
															it: {
																metadata: 123
															}
														}
													}
												}
											}
										}]
									}
								}
							}
						}
					}
				}, {
					metadata: 'bbq',
					safe: true
				}]
			});
		});
	});

	describe('when renaming partially', function() {
		var output = null;
		var object = {
			safe: true,
			arr: [{
				metadata_123: 'wtf',
				safe: true
			}, {
				metadata_456: 'bbq',
				safe: true
			}]
		};

		before(function(done) {
			patchJson(object, function() {
				this.rename('$.arr[*].metadata_*', 'metadata');
			}, function(err, data) {
				output = data;
				done(err);
			});
		});

		it('should change the correct values', function() {
			expect(output).to.eql({
				safe: true,
				arr: [{
					metadata: 'wtf',
					safe: true
				}, {
					metadata: 'bbq',
					safe: true
				}]
			});
		});
	});

	describe('when rewriten through arrays of objects', function() {
		var output = null;
		var object = {
			arr: [{
				name: 'lol'
			}, {
				name: 'wtf'
			}],
			safe: true
		};

		before(function(done) {
			patchJson(object, function() {
				this.rewrite('$.arr[*].name', function(match) {
					return {
						value: match.value.toUpperCase()
					};
				});
			}, function(err, data) {
				output = data;
				done(err);
			});
		});

		it('should change the correct values', function() {
			expect(output).to.eql({
				arr: [{
					name: 'LOL'
				}, {
					name: 'WTF'
				}],
				safe: true
			});
		});
	});
	
	describe('when rewriten through arrays of values', function() {
		var output = null;
		var object = {
			arr: ['a', 'b'],
			safe: true
		};

		before(function(done) {
			patchJson(object, function() {
				this.rewrite('$.arr[*]', function(match) {
					return {
						value: match.value.toUpperCase()
					};
				});
			}, function(err, data) {
				output = data;
				done(err);
			});
		});

		it('should change the correct values', function() {
			expect(output).to.eql({
				arr: ['A', 'B'],
				safe: true
			});
		});
	});

	describe('when renaming', function() {
		var output = null;
		var object = {
			test: 'wtf'
		};

		before(function(done) {
			patchJson(object, function() {
				this.rename('$.test', 'lol')
			}, function(err, data) {
				output = data;
				done(err);
			});
		});

		it('should have the correct key', function() {
			expect(output).to.have.property('lol', 'wtf');
		});

		it('should not have the old key', function() {
			expect(output).to.not.have.property('test');
		});
	});
	
	describe('when removing', function() {
		var output = null;
		var object = {
			lol: 'test',
			wtf: '123',
			bbq: {
				x: 1,
				y: 2,
				z: 3,
				sub: {
					sub2: {
						sub3: true
					},
					sub4: [
						'wtf',
						'bbq'
					]
				}
			},
			test: true,
			test2: {
				a: 1,
				b: 2,
				c: 3
			}
		};

		before(function(done) {
			patchJson(object, function() {
				this.remove('$.bbq');
				this.remove('$.test');
				this.remove('$.test2.b');
			}, function(err, data) {
				output = data;
				done(err);
			});
		});

		it('should remove the correct keys', function() {
			expect(output).to.not.have.property('bbq');
			expect(output).to.not.have.property('test');
			expect(output.test2).to.not.have.property('b');
		});

		it('should keep all other keys intact', function() {
			expect(output).to.eql({
				lol: 'test',
				wtf: '123',
				test2: {
					a: 1,
					c: 3
				}
			});
		});
	});

	describe('when changing the value', function() {
		var output = null;
		var object = {
			test: 'wtf'
		};

		before(function(done) {
			patchJson(object, function() {
				this.rewrite('$.test', function() {
					return {
						value: 'lol'
					};
				});
			}, function(err, data) {
				output = data;
				done(err);
			});
		});

		it('should have the correct value', function() {
			expect(output).to.have.property('test', 'lol');
		});
	});
});

