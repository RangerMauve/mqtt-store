"use strict";
var test = require("tape");

var MQTTStore = require("../");
var Result = MQTTStore.Result;

test("Basic operations", function (t) {
	t.plan(9);
	var store = new MQTTStore();
	store.put("foo/bar", "baz");
	t.pass("Able to put simple path into store");

	store.put("foo/+/#", "fizz");
	t.pass("Able to put path with wildcards into store");

	var result;

	result = store.get("foo/bar");
	t.deepEqual(result,  new Result(["foo", "bar"], "baz"), "Able to get simple path out");

	result = store.get("foo/baz");
	t.deepEqual(result, MQTTStore.NO_RESULT, "Getting invalid keys yields NO_RESULT");

	result = store.get("foo/+/#");
	t.deepEqual(result,  new Result(["foo", "+", "#"], "fizz"), "Able to get value with wildcards");

	store.put("foo", "bar");
	t.pass("Able to put single level path");

	result = store.get("foo");
	t.deepEqual(result, new Result(["foo"], "bar"), "Able to get single level path");

	result = store.del("foo");
	t.ok(result, "Got `true` from deleting a key");

	result = store.del("fizz/buzz");
	t.notok(result, "Got `false` from deleting a key");

	t.end();
});

test("Searching with pattern", function (t){
	t.plan(8);
	var store = new MQTTStore();

	var all_keys = [
		"foo",
		"foo/bar",
		"foo/baz",
		"foo/bar/baz",
		"foo/fizz/baz",
		"qux/bar"
	];
	
	all_keys.forEach(function(key){
		store.put(key, key);
	});

	var results;

	results = store.findMatching("foo");
	t.deepEqual(results, [simpleResult("foo")], "Able to get key with single path");

	results = store.findMatching("foo/bar");
	t.deepEqual(results,[simpleResult("foo/bar")], "Able to find key without wildcards");

	results = store.findMatching("foo/+");
	t.deepEqual(
		sortResults(results),
		sortResults([simpleResult("foo/bar"), simpleResult("foo/baz")]),
		"Able to get keys with + wildcard at end"
	);

	results = store.findMatching("foo/+/baz");
	t.deepEqual(
		sortResults(results),
		sortResults([
			simpleResult("foo/bar/baz"),
			simpleResult("foo/fizz/baz")
		]),
		"Able to get keys with + wildcard in middle of path"
	);

	results = store.findMatching("+/bar");
	t.deepEqual(
		sortResults(results),
		sortResults([
			simpleResult("foo/bar"),
			simpleResult("qux/bar")
		]),
		"Able to get keys with + wildcard in the middle"
	);

	results = store.findMatching("foo/#");
	t.deepEqual(
		sortResults(results),
		sortResults([
			simpleResult("foo/bar"),
			simpleResult("foo/baz"),
			simpleResult("foo"),
			simpleResult("foo/bar/baz"),
			simpleResult("foo/fizz/baz")
		]),
		"Able to get keys with # wildcard at end"
	);

	results = store.findMatching("#");
	t.deepEqual(
		sortResults(results),
		sortResults(all_keys.map(simpleResult)),
		"Using # wildcard and nothing else gets all keys"
	);

	
	t.throws(function(){
		store.findMatching("#/bar");
	},
	/# wildcard can only be at the end of a pattern/,
	"Placing wildcard anywhere other than the end throws an error");
});

test("Finding matching patterns", function (t){
	t.plan(1);
	var store = new MQTTStore();

	var all_keys = [
		"foo/bar/baz",
		"foo/+/baz",
		"foo/#"
	];

	all_keys.forEach(function (key) {
		store.put(key, key);
	});

	var results = store.findPatterns("foo/bar/baz");
	t.deepEqual(
		sortResults(results),
		sortResults(all_keys.map(simpleResult)),
		"Able to find all patterns matching a key"
	);

});

function simpleResult(key){
	return new Result(key.split("/"), key);
}

function sortResults(list){
	return list.sort(function(a, b){
		if(a.key > b.key)
			return 1;
		else if(a.key < b.key)
			return -1;
		return 0;
	});
}