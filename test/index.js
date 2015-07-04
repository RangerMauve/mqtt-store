var chai = require("chai");
var assert = chai.assert;
var expect = chai.expect;

var MQTTStore = require("../");

describe("MQTTStore", function () {
	var store;

	beforeEach(function () {
		store = new MQTTStore();
	});

	describe("#set(key, value)", function () {
		it("should be able to set a topic with one level", function () {
			store.set("1", "1");
			assert.equal(store.tree.children[1].value, "1", "key is set to \"1\"");
		});

		it("should be able to set a nested topic", function () {
			store.set("2/2", "2");
			assert.equal(store.tree.children[2].children[2].value, "2", "key is set to \"2\"");
		});

		it("should be able to overwrite an existing topic", function () {
			store.set("3", "3");
			store.set("3", "33");
			assert.equal(store.tree.children[3].value, "33", "key is set to \"33\"");
		});

		it("should accept wildcards as though they were regular part of the path", function () {
			store.set("4/+/4/#", "4");
			assert.equal(store.tree.children[4].children["+"].children["4"].children["#"].value, 4);
		});
	});

	describe("#get(key)", function () {
		it("should return undefined on keys that don't exist", function () {
			var value = store.get("1")
			assert.equal(value, undefined, "value is undefined");
		});

		it("should return the value set at a non-nested key path", function () {
			store.set("2", 2);
			var value = store.get("2");
			assert.equal(value, 2, "value is 2");
		});

		it("should return deeply nested values properly", function () {
			store.set("3/3/3/3", 3);
			var value = store.get("3/3/3/3");
			assert.equal(value, 3, "value is three");
		});

		it("should handle wildcards like reguar keys", function () {
			store.set("4/+/4/#", 4);
			var value = store.get("4/+/4/#");
			assert.equal(value, 4, "value is 4");
		});
	});

	describe("#query(topic)", function () {
		it("should return an empty array when there are no matches", function () {
			var values = store.query("1/+");
			assert.deepEqual(values, [], "is an empty array");
		});

		it("should return an array of values that match single level wildcards", function () {
			store.set("2/2", "2");
			store.set("22", "2");
			store.set("2/22", "2");
			var values = store.query("2/+");
			assert.deepEqual(values, ["2", "2"], "is array with two elements of \"2\"");
		});

		it("should get all values in sub-paths with multi level wildcards", function () {
			store.set("3/3/3", "3");
			store.set("3/3", "3");
			store.set("3/3/3/3", "3");
			store.set("3", "3");
			var values = store.query("#");
			assert.deepEqual(values, ["3", "3", "3", "3"], "is array with 4 3s");
		});

		it("should support a mix of both wildcards", function () {
			store.set("4/4/4", "4");
			store.set("4/44/4/4", "4");
			store.set("4/444/444", "4");
			var values = store.query("4/+/#");
			assert.deepEqual(values, ["4", "4", "4"], "is array with 4 4s");
		});

		it("shouldn't return undefined matches (ones that got unset)", function () {
			store.set("5/5/5", "5");
			store.set("5/5/5", undefined);
			var values = store.query("5/#");
			assert.deepEqual(values, [], "is an empty array");
		});
	});

	describe("#match(topic)", function () {
		it("should return an empty array when there are no matches", function () {
			var values = store.query("1/1/1");
			assert.deepEqual(values, [], "is an empty array");
		});

		it("should return direct matches only once", function () {
			store.set("2/2", "2");
			var values = store.match("2/2");
			assert.deepEqual(values, ["2"], "is an array with one 2");
		});

		it("should return matches on single wildcards", function () {
			store.set("3/+", "3");
			var values = store.match("3/3");
			assert.deepEqual(values, ["3"], "is an array with one 3");
		});

		it("should return matches on multi wildcards", function () {
			store.set("4/#", "4");
			var values = store.match("4/4");
			assert.deepEqual(values, ["4"], "is an array with one 4");
		});

		it("should return matches on multi wildcards that match the end of the topic", function () {
			store.set("5/5/#", "5");
			var values = store.match("5/5");
			assert.deepEqual(values, ["5"], "is an array with one 5");
		});

		it("should find all wildcards that match the topic", function () {
			store.set("6/+/6", "6");
			store.set("6/6/6", "6");
			store.set("6/#", "6");
			var values = store.match("6/6/6");
			assert.deepEqual(values, ["6", "6", "6"], "is array with 3 6s");
		});

		it("shouldn't return undefiend matches (ones that got unset)", function () {
			store.set("7/7/7", "7");
			store.set("7/7/7", undefined);
			var values = store.match("7/7/7");
			assert.deepEqual(values, [], "it is an empty array");
		});
	});
});
