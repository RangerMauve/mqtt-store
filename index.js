"use strict";
module.exports = MQTTStore;

// CONSTANTS
var NO_RESULT = new Result([], null);
var WILDCARD_ALL = "#";
var WILDCARD_ONE = "+";

MQTTStore.NO_RESULT = NO_RESULT;
MQTTStore.Tree = Tree;
MQTTStore.Result = Result;

// TYPE DECLARATIONS

function MQTTStore() {
	if (!(this instanceof MQTTStore))
		return new MQTTStore();
	this.tree = {
		children: {}
	};
}

MQTTStore.prototype = {
	tree: null,

	get: get,
	put: put,
	findMatching: findMatching,
	findPatterns: findPatterns,
};

function Result(sections, value) {
	this.sections = sections;
	this.value = value;
	this.key = sections.join("/");
}

Result.prototype = {
	key: "",
	sections: null,
	value: null,
};

function Tree() {
	this.children = {};
}

Tree.prototype = {
	hasValue: false,
	children: null,
	value: null,
};

// METHOD DEFINITIONS

function put(key, value) {
	var sections = key.split("/");
	if (!sections.length) return this;
	var tree = this.tree;
	putValue(sections, tree, value, 0);
	return this;
}

function get(key) {
	var sections = key.split("/");
	if (!sections.length) return NO_RESULT;
	var tree = this.tree;
	return getValue(sections, tree, 0);
}

function findMatching(pattern) {
	var sections = pattern.split("/");
	checkPattern(sections);
	var results = [];
	if (!sections.length) return results;
	var tree = this.tree;
	addMatching(sections, tree, [], results, 0);
	return results;
}

function findPatterns(key) {
	checkBasic(key);
	var sections = key.split("/");
	var results = []
	if(!sections.length) return results;
	addMatchers(sections, tree, [], results, 0);
	return results;
}

// ABSTRACT OPERATIONS

function addMatchers(sections, tree, resultSections, results, index){
	var hasAll = getChild(tree, WILDCARD_ALL);
	if(hasAll) addValue(resultSections.concat(WILDCARD_ALL), hasAll, results);
	
	var hasOne = getChild(tree, WILDCARD_ONE);
	if(hasOne) addMatchers(
		sections,
		hasOne,
		resultSections.concat(WILDCARD_ONE),
		results,
		index + 1
	);

	var section = sections[index];
	var hasSection = getChild(tree, section);
	if (hasSection) addMatchers(
		sections,
		hasOne,
		resultSections.concat(section),
		results,
		index + 1
	);
}

function addMatching(sections, tree, resultSections, results, index) {
	var section = sections[index];
	if (!section) {
		addValue(resultSections, tree, results);
	} else if (section[0] === WILDCARD_ALL) {
		addAllWildcard(sections, tree, resultSections, results);
	} else if (section[0] === WILDCARD_ONE) {
		addOneWildcard(sections, tree, resultSections, results, index);
	} else {
		var nextChild = getChild(tree, section);
		if (nextChild) {
			addMatching(sections, nextChild, resultSections.concat(section), results, index + 1);
		}
	}
}

function getChild(tree, section) {
	var child = tree.children[section];
	if (!child) return null;
	return child;
}

function putValue(sections, tree, value, index) {
	var section = sections[index];

	ensureExists(tree, section);
	var existing = getChild(tree, section);

	if (isLast(sections, index)) {
		existing.hasValue = true;
		existing.value = value;
	} else {
		putValue(sections, existing, value, index + 1);
	}
}

function ensureExists(tree, section) {
	if (!tree.children[section])
		tree.children[section] = new Tree();
}

function getValue(sections, tree, index) {
	var section = sections[index];
	var existing = getChild(tree, section);
	if (!existing) return NO_RESULT;
	if (isLast(sections, index))
		return new Result(sections, existing.value);
	return getValue(sections, existing, index + 1);
}

function isLast(sections, index) {
	return index === (sections.length - 1);
}

function addAllWildcard(sections, tree, resultSections, results) {
	if (resultSections.length)
		addValue(resultSections, tree, results);
	addAllValues(resultSections, tree, results);
}

function addOneWildcard(sections, tree, resultSections, results, index) {
	var names = childNames(tree);
	var children = tree.children;
	var length = names.length;
	var nameIndex = length;
	for (; nameIndex; nameIndex--) {
		var currentKey = names[nameIndex - 1];
		var currentTree = children[currentKey];
		var currentSections = resultSections.concat(currentKey);
		addMatching(sections, currentTree, currentSections, results, index + 1);
	}
}

function addValue(resultSections, tree, results) {
	if (tree.hasValue) {
		var value = tree.value;
		results.push(new Result(resultSections, value));
	}
}

function addAllValues(resultSections, tree, results) {
	var names = childNames(tree);
	var children = tree.children;
	var length = names.length;
	var nameIndex = length;
	for (; nameIndex; nameIndex--) {
		var currentKey = names[nameIndex - 1];
		var currentTree = children[currentKey];
		var currentSections = resultSections.concat(currentKey);
		addValue(currentSections, currentTree, results);
		addAllValues(currentSections, currentTree, results);
	}
}

function childNames(tree) {
	var children = tree.children;
	return Object.keys(children);
}

// Validation functions

function checkPattern(sections) {
	var length = sections.length;
	for (var index = 0; index < length; index++) {
		var current = sections[index];
		if (current[0] === WILDCARD_ALL) {
			if (!isLast(sections, index))
				throw new TypeError("# wildcard can only be at the end of a pattern. In: " + sections.join("/"));
		}
	}
}

function checkBasic(key) {
	var hasAll = key.indexOf(WILDCARD_ALL) !== -1;
	var hasOne = key.indexOf(WILDCARD_ONE) !== -1;
	if (hasAll || hasOne)
		throw new TypeError("Cannot use key with wildcards finding patterns: " + key);
}
