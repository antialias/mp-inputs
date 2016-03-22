export function extend() {
    return Object.assign.apply(null, [{}].concat(Array.prototype.slice.call(arguments)));
}
