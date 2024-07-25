// TODO: These are intended as temporary stand-ins until this functionality has been implemented directly in LibAuth.
//       We are doing this so that we may better standardize with the rest of the BCH eco-system in future.
//       See: https://github.com/bitauth/libauth/pull/108
const extendedJsonReplacer = function (value) {
    switch (typeof value) {
        case 'bigint':
            return `<bigint: ${value.toString()}n>`;
        default:
            return value;
    }
};
const extendedJsonReviver = function (value) {
    // Define RegEx that matches our Extended JSON fields.
    const bigIntRegex = /^<bigint: (?<bigint>[+-]?[0-9]*)n>$/;
    // Only perform a check if the value is a string.
    // NOTE: We can skip all other values as all Extended JSON encoded fields WILL be a string.
    if (typeof value === 'string') {
        // Check if this value matches an Extended JSON encoded bigint.
        const bigintMatch = value.match(bigIntRegex);
        if (bigintMatch) {
            // Access the named group directly instead of using array indices
            const { bigint } = bigintMatch.groups;
            // Return the value casted to bigint.
            return BigInt(bigint);
        }
    }
    // Return the original value.
    return value;
};
const encodeExtendedJsonObject = function (value) {
    // If this is an object type (and it is not null - which is technically an "object")...
    if (typeof value === 'object' && value !== null) {
        // If this is an array, recursively call this function on each value.
        if (Array.isArray(value)) {
            return value.map(encodeExtendedJsonObject);
        }
        // Declare object to store extended JSON entries.
        const encodedObject = {};
        // Iterate through each entry and encode it to extended JSON.
        for (const [key, valueToEncode] of Object.entries(value)) {
            encodedObject[key] = encodeExtendedJsonObject(valueToEncode);
        }
        // Return the extended JSON encoded object.
        return encodedObject;
    }
    // Return the replaced value.
    return extendedJsonReplacer(value);
};
const decodeExtendedJsonObject = function (value) {
    // If this is an object type (and it is not null - which is technically an "object")...
    if (typeof value === 'object' && value !== null) {
        // If this is an array, recursively call this function on each value.
        if (Array.isArray(value)) {
            return value.map(decodeExtendedJsonObject);
        }
        // Declare object to store decoded JSON entries.
        const decodedObject = {};
        // Iterate through each entry and decode it from extended JSON.
        for (const [key, valueToEncode] of Object.entries(value)) {
            decodedObject[key] = decodeExtendedJsonObject(valueToEncode);
        }
        // Return the extended JSON encoded object.
        return decodedObject;
    }
    // Return the revived value.
    return extendedJsonReviver(value);
};
const encodeExtendedJson = function (value, space = undefined) {
    const replacedObject = encodeExtendedJsonObject(value);
    const stringifiedObject = JSON.stringify(replacedObject, null, space);
    return stringifiedObject;
};
const decodeExtendedJson = function (json) {
    const parsedObject = JSON.parse(json);
    const revivedObject = decodeExtendedJsonObject(parsedObject);
    return revivedObject;
};
//# sourceMappingURL=extended-json-util.js.map