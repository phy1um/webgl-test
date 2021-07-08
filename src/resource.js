
const RESOURCES = {};
const placeholderPixel = new Uint8Array([0,0,255,255]);

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

export function loadTexture(gl, path) {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, placeholderPixel);
    const img = new Image();
    img.onload = function() {
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    };
    img.src = path;
    return tex;

}

export function getResource(path) {
    return RESOURCES[path];
}