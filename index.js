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

function get(key) {
	return get_one(split(key), this.tree);
}

function query(key) {
	return get_all(split(key), this.tree);
}

function match(key) {
	var exact = this.get(key);
	var results = [];
	if (exact !== undefined) results.push(exact);
	return results.concat(get_matching(key, this.tree));
}

function set(key, value) {
	set_one(split(key), this.tree, value);
	return value;
}

function remove_one(path, tree) {
	if (!path.length) return;
	var next = path[0];
	if (!(next in tree.children)) return;
	return remove_one(path.slice(1), tree);
}

function set_one(path, tree, value) {
	if (!path.length) return tree.value = value;
	var next = path[0];
	var children = tree.children;
	var next_tree = children[next];
	if (!next_tree)
		next_tree = children[next] = {
			children: {}
		};
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
	if (!path.length)
		return [tree.value];

	var next = path[0];

	if (next === "+") return values(tree.children)
		.map(get_all.bind(null, path.slice(1)))
		.reduce(flatten, []);

	if (next === "#") return all_values(tree);

	var next_tree = tree.children[next];
	if (!next_tree) return [];
	return get_all(path.slice(1), next_tree);
}

function get_matching(path, tree) {
	if (!path.length) return tree.value;
	var multi = tree.children["#"];
	var single = tree.children["+"];

	var next = path[0];
	var next_tree = tree.children[next];

	var rest = path.slice(1);
	return [multi, single, next_tree]
		.reduce(function(all, subtree) {
			if (subtree) return all.concat(get_matching(res, subtree));
			return all;
		}, []);
}

function all_values(tree) {
	return values(tree.children).map(function(subtree) {
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
	return keys(object).map(function(key) {
		return object[key];
	});
}

function flatten(prev, current) {
	return prev.concat(current);
}

function split(path) {
	return path.split("/");
}
