// mapState.js
let map__ready = false;

export function mymap__ready__set(value) {
    map__ready = value;
}

export function mymap__isReady() {
    return map__ready;
}

// In mapState.js
let mymap = null;

export function mymap__set(mymapValue) {
    mymap = mymapValue;
}

export function mymap__get() {
    return mymap;
}