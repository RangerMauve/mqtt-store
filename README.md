# mqtt-store
Store and retrieve data using MQTT keypaths. You can set values, then query for values that match a [wildcard](https://www.hivemq.com/blog/mqtt-essentials-part-5-mqtt-topics-best-practices). Or set values with wildcards and find all wildcards that match a simple topic.

```
npm install mqtt-store --save
```

## Example:

```javascript
var MQTTStore = require("mqtt-store");

var store = new MQTTStore();

store.set("hello/world", "Greetings");
store.get("hello/world");
// #=> {key: "hello/world", value: "Greetings"}

store.set("foo/bar/baz", "woot");
store.set("foo/bar", "woot wooo");
store.findMatching("foo/#");
// #=> [
//	{key: "foo/bar/baz", value: "woot"},
//	{key: "foo/bar", value: "woot wooo"}
// ]

store.set("fizz/#", "lolwat");
store.set("fizz/buzz/+", "neat");
store.findPatterns("fizz/buzz/quix");
// #=> [
//	{key: "fizz/#", value: "lolwat"},
//	{key: "fizz/buzz/+", value: "neat"}
// ]
```

## API

### `MQTTStore.Result(sections, value)`
All results from queries are represented as a `Result` object.

#### `MQTTStore.Result#key : String`
The full key string for where the result was found

#### `MQTTStore.Result#value : Any`
The value stored in this result

#### `MQTTStore.Result#sections : Array<String>`
The key, split in to an array of sections


### `MQTTStore()`
There is no configuration for the store currently, can be called either with `new` or just as a function.

#### `MQTTStore#put(key : String, value : Any)`
Sets a value in the store. In the background the topic will get split up into a path and will build up a tree. Topics with wildcards get set as through the wildcard was a literal key.

#### `MQTTStore#get(key : String) : Result<Any>`
Gets a single value from the store that was set at the given topic. If nothing was set at this topic, then `MQTTStore.NO_RESULT` is returned.

#### `MQTTStore#.del(key : String) : Boolean`
Deletes the value stored at the key if it exists. Returns `true` if the key contained a value, `false` if the key didn't exist or had no value.

#### `MQTTStore#findMatching(key : String) : Array<Result<Any>>`
Takes a topic with wildcards and returns all keys that match that topic. Returns an array of Results.

#### `MQTTStore#findPatterns(key : String) : Array<Result<Any>>`
Takes a topic and returns all values (that might contain wildcards) that match against that topic. Returns an array of Results.
