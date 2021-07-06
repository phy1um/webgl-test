import { loadText, getResource } from "./resource";

function createShader(gl, type, src) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    const res = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (!res) {
        console.error("Failed to compile shader");
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

function createShaderProgram(gl, vert, frag) {
    const prog = gl.createProgram();
    gl.attachShader(prog, vert);
    gl.attachShader(prog, frag);
    gl.linkProgram(prog);
    const res = gl.getProgramParameter(prog, gl.LINK_STATUS);
    if (!res) {
        console.error("Failed to create shader program!");
        console.error(gl.getProgramInfoLog(prog));
        gl.deleteProgram(prog);
        return null;
    }
    return prog;
}

const tri = [
    0,0,
    0,0.5,
    0.7,0
];

// Entrypoint
(async function(){

    const canvas = document.getElementById("c");
    const gl = canvas.getContext("webgl");
    if (gl === null) {
        alert("Your browser does not support WebGL!");
        return null;
    }

    await loadText("/res/fragment.glsl");
    const fs = createShader(gl, gl.FRAGMENT_SHADER, getResource("/res/fragment.glsl"));
    await loadText("/res/vertex.glsl");
    const vs = createShader(gl, gl.VERTEX_SHADER, getResource("/res/vertex.glsl"));
    const program = createShaderProgram(gl, vs, fs);
    const posAttrib = gl.getAttribLocation(program, "a_position");
    const posBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(tri), gl.STATIC_DRAW);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.clearColor(0.2, 0.5, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    gl.useProgram(program);
    gl.enableVertexAttribArray(posAttrib);

    gl.vertexAttribPointer(posAttrib, 2, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLES, 0, 3);

}());