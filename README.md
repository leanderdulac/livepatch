# livepatch
[![Build Status](https://travis-ci.org/pagarme/livepatch.svg)](https://travis-ci.org/pagarme/livepatch) [![Coverage Status](https://coveralls.io/repos/pagarme/livepatch/badge.svg?branch=master)](https://coveralls.io/r/pagarme/livepatch?branch=master)

Patch JSON streams on the fly.

# Example

```js
var fs = require('fs');
var livepatch = require('livepatch');

fs.createReadStream('test.json')
	.pipe(livepatch(function() {
		/* Transformations goes here */

		this.rename('$.name_*', 'name'); // Renames all keys in the root starting with 'name_' to 'name'

		this.remove('$._*'); // Removes all fields in the root starting with an underscore

		// Advanced usage
		this.rewrite('$.author', function(match) {
			return {
				rename: 'author_name',
				value: match.value.toUpperCase()
			};
		});
	}))
	.pipe(fs.createWriteStream('output.json'));
```

# Documentation

## rename(path, name)

Renames all fields matched by `path` to `name`.

## remove(path)

Remove all fields matched by `path`.

## rewrite(path, rewriteFn)

Rewrite all fields matched by `path` using `rewriteFn`.

The passed function receives an argument with the following information:

**key:** current key name
**path:** current path(as an array)
**value:** current key value(if available)

It should return a JSON object with atleast one of the following actions:

**rename:** Renames the fields with the given value
**remove:** If `true`, removes the key
**value:** Changes the key value

## path

All paths used in transformations are based on the JSONPath spec.

`$` denotes the root of the object
`.` denotes the end of a key name
`*` denotes any range of characters

### Examples

`$.name`
Matches the `name` field.

`$.books[*].author`
Matches all books authors.

`$.books[*].*_name`
Matches all fields in a book that ends with `_name`.

# How it works

LivePatch works by reading a JSON stream with [clarinet](https://github.com/dscape/clarinet) and doing live modifications based on the current path in the stream. After patching, it immediatly serializes to the next stream the resulting JSON.

It's very useful when dealing with very large objects which came from a stream(e.g.: ElasticSearch results) that need to be modified and streamed to another place(e.g.: network). As it doesn't hold the entire data on memory you don't need to worry about loading large files.

# License

Check [here](LICENSE).


