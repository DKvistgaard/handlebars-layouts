'use strict';

var handlebarsLayouts = require('../index'),
	es = require('event-stream'),
	expect = require('expect.js'),
	fs = require('fs'),
	handlebars = require('handlebars'),
	path = require('path'),
	vs = require('vinyl-fs');

describe('handlebars-layouts', function () {
	function toPartial(file, cb) {
		var name = path.basename(file.path).replace(/\.[^.]+$/, '');

		handlebars.registerPartial(name, file.contents.toString());

		cb(null, file);
	}

	function toEqualExpected(file, cb) {
		var data = require('./fixtures/data.json'),
			actual = file.path.replace('fixtures', 'actual'),
			expected = file.path.replace('fixtures', 'expected'),
			template = handlebars.compile(file.contents.toString()),
			retval = template(data);

		fs.writeFileSync(actual, retval, 'utf8');

		expect(retval).to.be(fs.readFileSync(expected, 'utf8'));

		cb(null, file);
	}

	before(function (done) {
		// Register Helpers
		handlebarsLayouts(handlebars);

		// Register Partials
		vs.src(__dirname + '/fixtures/partials/**/*.hbs')
			.pipe(es.map(toPartial))
			.on('error', done)
			.on('end', done);
	});

	it('should throw an error if partial is not registered', function () {
		function undef() {
			var template = handlebars.compile('{{#extend "undef"}}{{/extend}}');

			template({});
		}

		expect(undef).to.throwError();
	});

	it('should not compile if partial is already a function', function () {
		var template = handlebars.compile('{{#extend "func"}}{{/extend}}');

		handlebars.registerPartial('func', handlebars.compile('func'));

		expect(template({})).to.be('func');
	});

	it.only('should render layouts properly', function (done) {
		vs.src(__dirname + '/fixtures/*.hbs')
			.pipe(es.map(toEqualExpected))
			.on('error', done)
			.on('end', done);
	});
});
