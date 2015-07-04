# mqtt-store
Store and retrieve data using MQTT keypaths. You can set values, then query for values that match a wildcard. Or set values with wildcards and find all wildcards that match a simple topic.

```
npm install mqtt-store --save
```

## Example:

```javascript
var MQTTStore = require("mqtt-store");

var store = new MQTTStore();

store.set("hello/world", "Greetings");
store.get("hello/world"); // #=> "Greetings"

store.set("foo/bar/baz", "woot");
store.set("foo/bar", "woot wooo");
store.query("foo/#"); // #=> ["woot", "woot woo"]

store.set("fizz/#", "lolwat");
store.set("fizz/buzz/+", "neat");
store.match("fizz/buzz/quix"); // #=> ["lolwat", "neat"]
```

## API
### `MQTTStore()`
There is no configuration for the store currently, can be called either with `new` or just as a function.

### `MQTTStore#set(topic, value)`
Sets a value in the store. In the background the topic will get split up into a path and will build up a tree. Set a key to `undefined` to essentially "unset" it. Topics with wildcards get set as through the wildcard was a literal key.

### `MQTTStore#get(topic)`
Gets a single value from the store that was set at the given topic. If nothing was set at this topic, then `undefiend` is returned.

### `MQTTStore#query(topic)`
Takes a topic with wildcards and returns all values that match that topic. Returns an array of values.

### `MQTTStore#match(topic)`
Takes a topic without wildcards and returns all values (that might contain wildcards) that match against that topic. Returns an array of values.
