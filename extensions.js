/* https://stackoverflow.com/questions/8495687/split-array-into-chunks */
/**
 * Divide array into chunks
*/
Object.defineProperty(Array.prototype, 'chunk', {
    value: function(chunkSize) {
        var R = [];
        for (var i = 0; i < this.length; i += chunkSize)
            R.push(this.slice(i, i + chunkSize));
        return R;
    }
});

Object.defineProperty(Object.prototype, 'bucket', {
    value: function(bucket, keys, value) {

        if (keys.length === 1) {
            bucket[keys[0]] = bucket[keys[0]] === undefined ? [] : bucket[keys[0]];
            bucket[keys[0]].push(value);
        } else {
            let key = keys.shift();

            bucket[key] = bucket[key] === undefined ? {} : bucket[key];
            bucket[key] = this.bucket(bucket[key], keys, value);

        }

        return bucket;

    }
});

Object.defineProperty(Object.prototype, 'access', {
    value: function(keys, defaultValue) {

        let access = this;

        for (let i = 0; i < keys.length; i++) {

            if (access[keys[i]] === undefined || access[keys[i]] === null) {
                return defaultValue;
            } else {
                access = access[keys[i]];
            }

        }

        return access;

    }
});

/* https://stackoverflow.com/questions/1026069/how-do-i-make-the-first-letter-of-a-string-uppercase-in-javascript */
/**
 * Capitalize the first letter of a string
 * @returns {string}
 */
String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1)
};

/**
 * Compare two strings without case sensitivity
 * @param compare
 * @returns {boolean}
 */
String.prototype.equivalent = function(compare) {
    return compare.toLowerCase() === this.toLowerCase();
};

/**
 * Access an array index and default to a value
 * @param index
 * @param defaultVal
 * @returns {*}
 */
Array.prototype.at = function(index, defaultVal) {
    return this[index] === undefined ? defaultVal : this[index];
};