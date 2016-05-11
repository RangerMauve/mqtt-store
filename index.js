"use strict";
module.exports = MQTTStore;

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
	query: query,
	match: match,
	set: set
};


function Tree() {
	this.children = [];
}

Tree.prototype = {
	children: [],
	value: null
};

function get(key) {
	return get_one(split(key), this.tree);
}

function query(key) {
	return get_all(split(key), this.tree);
}

function match(key) {
	return get_matching(split(key), this.tree);
}

function set(key, value) {
	set_one(split(key), this.tree, value);
	return value;
}

function set_one(path, tree, value) {
	if (!path.length) {
		tree.value = value;
		return;
	}
	var next = path[0];
	var children = tree.children;
	var next_tree = children[next];
	if (!next_tree) {
		next_tree = new Tree();
		children[next] = next_tree;
	}
	set_one(path.slice(1), tree.children[next], value);
}

function get_one(path, tree) {
	if (!path.length) return tree.value;
	var next = path[0];
	var next_tree = tree.children[next];
	if (!next_tree) return undefined;
	return get_one(path.slice(1), next_tree);
}

function get_all(path, tree) {
	if (!path.length) {
		var value = tree.value;
		if (value !== undefined) return [value];
		return [];
	}

	var next = path[0];

	if (next === "+") return values(tree.children)
		.map(get_all.bind(null, path.slice(1)))
		.reduce(flatten, []);

	if (next === "#") return all_values(tree);

	var next_tree = tree.children[next];
	if (!next_tree) return [];
	return get_all(path.slice(1), next_tree);
}

function get_tree_values(tree) {
	var results = [];
	var value = tree.value;
	if (value !== undefined) results.push(value);
	var multi = tree.children["#"];
	if (multi && multi.value)
		results.push(multi.value);
	return results;
}

function get_matching(path, tree) {
	if (!path.length) {
		return get_tree_values(tree);
	}

	var multi = tree.children["#"];
	var single = tree.children["+"];

	var next = path[0];
	var next_tree = tree.children[next];

	var rest = path.slice(1);

	var results = [];

	if (multi && multi.value)
		results.push(multi.value);

	return results.concat([single, next_tree]
		.reduce(function (all, subtree) {
			if (subtree) return all.concat(get_matching(rest, subtree));
			return all;
		}, []));
}

function all_values(tree) {
	return values(tree.children).map(function (subtree) {
		var all = all_values(subtree);
		var current = subtree.value;
		if (current !== undefined)
			all.push(current);
		return all;
	}).reduce(flatten, []);
}

function keys(object) {
	return Object.keys(object);
}

function values(object) {
	return keys(object).map(function (key) {
		return object[key];
	});
}

function flatten(prev, current) {
	return prev.concat(current);
}

function split(path) {
	return path.split("/");
}
