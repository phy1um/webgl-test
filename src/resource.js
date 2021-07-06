
const RESOURCES = {};

function store(k, x) {
    RESOURCES[k] = x;
    return x;
}

export function loadBinary(path) {
    return fetch(path).then(d => d.arrayBuffer())
        .then(ab => store(path, ab));
}

export function loadText(path) {
    return fetch(path).then(d => d.text())
        .then(txt => store(path, txt));
}

export function loadJson(path) {
    return fetch(path).then(d => d.json())
        .then(j => store(path, j));
}

export function getResource(path) {
    return RESOURCES[path];
}