"use strict";
var test = require("tape");

var MQTTStore = require("../");
var Result = MQTTStore.Result;

test("Basic operations", function (t) {
	t.plan(4);
	var store = new MQTTStore();
	store.put("foo/bar", "baz");
	t.pass("Able to put simple path into store");

	store.put("foo/+/#", "fizz");
	t.pass("Able to put path with wildcards into store");

	var result1 = store.get("foo/bar");
	t.deepEqual(result1,  new Result(["foo", "bar"], "baz"));

	var result2 = store.get("foo/+/#");
	t.deepEqual(result2,  new Result(["foo", "+", "#"], "fizz"));

	t.end();
});
