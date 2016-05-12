"use strict";
var test = require("tape");

var MQTTStore = require("../");

test("MQTTStore#set(key, value): should be able to set a topic with one level", function (t) {
	var store = new MQTTStore();
	t.plan(1);
	store.set("1", "1");
	t.equal(store.tree.children[1].value, "1", "key is set to \"1\"");
});

test("MQTTStore#set(key, value): should be able to set a nested topic", function (t) {
	t.plan(1);
	var store = new MQTTStore();
	store.set("2/2", "2");
	t.equal(store.tree.children[2].children[2].value, "2", "key is set to \"2\"");
});

test("MQTTStore#set(key, value): should be able to overwrite an existing topic", function (t) {
	t.plan(1);
	var store = new MQTTStore();
	store.set("3", "3");
	store.set("3", "33");
	t.equal(store.tree.children[3].value, "33", "key is set to \"33\"");
});

test("MQTTStore#set(key, value): should accept wildcards as though they were regular part of the path", function (t) {
	t.plan(1);
	var store = new MQTTStore();
	store.set("4/+/4/#", "4");
	t.equal(store.tree.children[4].children["+"].children["4"].children["#"].value, "4", "key is set to \"4\"");
});

test("MQTTStore#get(key): should return undefined on keys that don't exist", function (t) {
	t.plan(1);
	var store = new MQTTStore();
	var value = store.get("1");
	t.equal(value, undefined, "value is undefined");
});

test("MQTTStore#get(key): should return the value set at a non-nested key path", function (t) {
	t.plan(1);
	var store = new MQTTStore();
	store.set("2", 2);
	var value = store.get("2");
	t.equal(value, 2, "value is 2");
});

test("MQTTStore#get(key): should return deeply nested values properly", function (t) {
	t.plan(1);
	var store = new MQTTStore();
	store.set("3/3/3/3", 3);
	var value = store.get("3/3/3/3");
	t.equal(value, 3, "value is three");
});

test("MQTTStore#get(key): should handle wildcards like reguar keys", function (t) {
	t.plan(1);
	var store = new MQTTStore();
	store.set("4/+/4/#", 4);
	var value = store.get("4/+/4/#");
	t.equal(value, 4, "value is 4");
});

test("MQTTStore#query(topic): should return an empty array when there are no matches", function (t) {
	t.plan(1);
	var store = new MQTTStore();
	var values = store.query("1/+");
	t.deepEqual(values, [], "is an empty array");
});

test("MQTTStore#query(topic): should return an array of values that match single level wildcards", function (t) {
	t.plan(1);
	var store = new MQTTStore();
	store.set("2/2", "2");
	store.set("22", "2");
	store.set("2/22", "2");
	var values = store.query("2/+");
	t.deepEqual(values, ["2", "2"], "is array with two elements of \"2\"");
});

test("MQTTStore#query(topic): should get all values in sub-paths with multi level wildcards", function (t) {
	t.plan(1);
	var store = new MQTTStore();
	store.set("3/3/3", "3");
	store.set("3/3", "3");
	store.set("3/3/3/3", "3");
	store.set("3", "3");
	var values = store.query("#");
	t.deepEqual(values, ["3", "3", "3", "3"], "is array with 4 3s");
});

test("MQTTStore#query(topic): should support a mix of both wildcards", function (t) {
	t.plan(1);
	var store = new MQTTStore();
	store.set("4/4/4", "4");
	store.set("4/44/4/4", "4");
	store.set("4/444/444", "4");
	var values = store.query("4/+/#");
	t.deepEqual(values, ["4", "4", "4"], "is array with 4 4s");
});

test("MQTTStore#query(topic): shouldn't return undefined matches (ones that got unset)", function (t) {
	t.plan(1);
	var store = new MQTTStore();
	store.set("5/5/5", "5");
	store.set("5/5/5", undefined);
	var values = store.query("5/#");
	t.deepEqual(values, [], "is an empty array");
});

test("MQTTStore#match(topic): should return an empty array when there are no matches", function (t) {
	t.plan(1);
	var store = new MQTTStore();
	var values = store.query("1/1/1");
	t.deepEqual(values, [], "is an empty array");
});

test("MQTTStore#match(topic): should return direct matches only once", function (t) {
	t.plan(1);
	var store = new MQTTStore();
	store.set("2/2", "2");
	var values = store.match("2/2");
	t.deepEqual(values, ["2"], "is an array with one 2");
});

test("MQTTStore#match(topic): should return matches on single wildcards", function (t) {
	t.plan(1);
	var store = new MQTTStore();
	store.set("3/+", "3");
	var values = store.match("3/3");
	t.deepEqual(values, ["3"], "is an array with one 3");
});

test("MQTTStore#match(topic): should return matches on multi wildcards", function (t) {
	t.plan(1);
	var store = new MQTTStore();
	store.set("4/#", "4");
	var values = store.match("4/4");
	t.deepEqual(values, ["4"], "is an array with one 4");
});

test("MQTTStore#match(topic): should return matches on multi wildcards that match the end of the topic", function (t) {
	t.plan(1);
	var store = new MQTTStore();
	store.set("5/5/#", "5");
	var values = store.match("5/5");
	t.deepEqual(values, ["5"], "is an array with one 5");
});

test("MQTTStore#match(topic): should find all wildcards that match the topic", function (t) {
	t.plan(1);
	var store = new MQTTStore();
	store.set("6/+/6", "6");
	store.set("6/6/6", "6");
	store.set("6/#", "6");
	var values = store.match("6/6/6");
	t.deepEqual(values, ["6", "6", "6"], "is array with 3 6s");
});

test("MQTTStore#match(topic): shouldn't return undefiend matches (ones that got unset)", function (t) {
	t.plan(1);
	var store = new MQTTStore();
	store.set("7/7/7", "7");
	store.set("7/7/7", undefined);
	var values = store.match("7/7/7");
	t.deepEqual(values, [], "it is an empty array");
});
