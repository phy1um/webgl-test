import { loadText, getResource, loadTexture } from "./resource";
import { mat4, quat, vec3 } from "./gl-matrix/gl-matrix.js";

function createShader(gl, type, src) {
    console.log("Loading shader: " +src);
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

const projMatrix = mat4.create();
mat4.perspective(projMatrix, 1.55, 4/3, 0.1, 1000);

// const tri = [
//     0,0,
//     0,0,
//     0,0.5,
//     0,1,
//     0.5,0,
//     1,0,

//     // V4
//     0, 0.5,
//     0, 1,
//     0.5, 0.5,
//     1, 1,
//     // V5
//     0.5, 0,
//     1, 0,
// ];

const cubeVerts = [
    -0.7, -0.7,  0.7, -1.0, -1.0,
    0.7, -0.7,  0.7, 1.0, -1.0,
    -0.7,  0.7,  0.7, -1.0, 1.0,
    0.7,  0.7,  0.7, 1.0, 1.0,
    -0.7, -0.7, -0.7, -1.0, -1.0,
    0.7, -0.7, -0.7, 1.0, -1.0,
    -0.7,  0.7, -0.7, -1.0, 1.0,
    0.7,  0.7, -0.7, 1.0, 1.0,
];

const cubeIndices = [
    0, 1, 2, 3, 7, 1, 5, 4, 7, 6, 2, 4, 0, 1
];

// Entrypoint
(async function(){

    const canvas = document.getElementById("c");
    const gl = canvas.getContext("webgl");
    if (gl === null) {
        alert("Your browser does not support WebGL!");
        return null;
    }

    const t1 = loadTexture(gl, "/res/tile.png");
    await loadText("/res/fragment.glsl");
    const fs = createShader(gl, gl.FRAGMENT_SHADER, getResource("/res/fragment.glsl"));
    await loadText("/res/vertex.glsl");
    const vs = createShader(gl, gl.VERTEX_SHADER, getResource("/res/vertex.glsl"));
    const program = createShaderProgram(gl, vs, fs);
    const posBuffer = gl.createBuffer();
    const indBuffer = gl.createBuffer();
   
    const qr = quat.create();
    //quat.rotateY(qr, qr, 0.9);
    const modelTransform = mat4.create();
    mat4.fromRotationTranslationScale(modelTransform, qr, vec3.fromValues(0, 0, 0), vec3.fromValues(0.6,0.6,0.6));

    const viewMatrix = mat4.create();
    const cameraPos = vec3.fromValues(5, 5, 5);
    const cameraTgt = vec3.fromValues(0, 0, 0);
    const up = vec3.fromValues(0, 1, 0);
    mat4.lookAt(viewMatrix, cameraPos, cameraTgt, up);

    function renderGlScene(gl, program, viewMatrix, dt) {

        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(program);
        const posAttrib = gl.getAttribLocation(program, "a_position");
        const uvAttrib = gl.getAttribLocation(program, "a_uv");
        const uniformCol = gl.getUniformLocation(program, "u_col");
        const uModel = gl.getUniformLocation(program, "u_modelMat");
        const uProject = gl.getUniformLocation(program, "u_projMat");
        const uView = gl.getUniformLocation(program, "u_viewMat");
        const textureSamplerU = gl.getUniformLocation(program, "u_sampler");

        gl.uniform4fv(uniformCol, [0.9, 0.0, 0.0, 1.0]);
        gl.uniformMatrix4fv(uModel, false, modelTransform);
        gl.uniformMatrix4fv(uProject, false, projMatrix);
        gl.uniformMatrix4fv(uView, false, viewMatrix);

        gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indBuffer);

        gl.enableVertexAttribArray(posAttrib);
        gl.enableVertexAttribArray(uvAttrib);
        gl.activeTexture(gl.TEXTURE0 + 5);
        gl.bindTexture(gl.TEXTURE_2D, t1);
        gl.uniform1i(textureSamplerU, 5);

        gl.vertexAttribPointer(posAttrib, 3, gl.FLOAT, false, 5*4, 0);
        gl.vertexAttribPointer(uvAttrib, 2, gl.FLOAT, false, 5*4, 3*4);

        gl.drawElements(gl.TRIANGLE_STRIP, 14, gl.UNSIGNED_BYTE, 0);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeVerts), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(cubeIndices), gl.STATIC_DRAW);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.clearColor(0.2, 0.5, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    gl.enable(gl.DEPTH_TEST);

    let then = 0;
    function render(now) {
        now *= 0.001;
        const dt = now - then;
        then = now;
        renderGlScene(gl, program, viewMatrix, dt);
        requestAnimationFrame(render);

        quat.rotateY(qr, qr, 0.3*dt);
        mat4.fromRotationTranslationScale(modelTransform, qr, vec3.fromValues(0, 0, 0), vec3.fromValues(0.6,0.6,0.6));
    }
    requestAnimationFrame(render);
}());