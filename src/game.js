import { loadText, getResource, loadTexture } from "./resource";
import { mat4, vec4, vec3, quat } from "./gl-matrix/gl-matrix.js";
import { Entity } from "./entity";
import { Renderable, Program } from "./draw.js";
import { readObjParts } from "./obj.js";

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


const projMatrix = mat4.create();
mat4.perspective(projMatrix, 1.2, 4/3, 0.1, 1000);

const cubeVerts = new Float32Array([
    -0.7, -0.7,  0.7, -1.0, -1.0,
    0.7, -0.7,  0.7, 1.0, -1.0,
    -0.7,  0.7,  0.7, -1.0, 1.0,
    0.7,  0.7,  0.7, 1.0, 1.0,
    -0.7, -0.7, -0.7, -1.0, -1.0,
    0.7, -0.7, -0.7, 1.0, -1.0,
    -0.7,  0.7, -0.7, -1.0, 1.0,
    0.7,  0.7, -0.7, 1.0, 1.0,
]);

const cubeIndices = new Uint16Array([
    0, 1, 2, 3, 7, 1, 5, 4, 7, 6, 2, 4, 0, 1
]);

const cameraPos = vec3.fromValues(1, 0, 5);
const cameraOffset = vec3.fromValues(0, 0, -1);
const cameraTgt = vec3.create();
const cameraAngles = [0,0];
const cameraRotQuat = quat.create();

const V3_Y = vec3.fromValues(0,1,0);

const cameraFwd = vec3.create();
const cameraOrtho = vec3.create();

let sens_scale = -0.1;

const EV = {FWD: 0, BACK: 0, LEFT: 0, RIGHT: 0};
function setInput(i) {
    return (ev) => {
        if (ev.key == "w") {
            EV.FWD = i;
        }
        if(ev.key == "s") {
            EV.BACK = i;
        }
        if(ev.key == "a") {
            EV.LEFT = i;
        }
        if(ev.key == "d") {
            EV.RIGHT = i;
        }
    };
}

function clampf(x, min, max) {
    if (x < min) {
        return min;
    } else if (x > max) {
        return max;
    } else {
        return x;
    }
}

// Entrypoint
(async function(){
    const canvas = document.getElementById("c");
    const gl = canvas.getContext("webgl");
    if (gl === null) {
        alert("Your browser does not support WebGL!");
        return null;
    }

    window.addEventListener("keydown", setInput(1));
    window.addEventListener("keyup", setInput(0));
    document.addEventListener("pointerlockchange", pointerLockChangeHandler, false);

    function pointerLockChangeHandler() {
        document.addEventListener("mousemove", mouseMoveHandler, false);
    }

    function mouseMoveHandler(e) {
        const dx = e.movementX || 0;
        const dy = e.movementY || 0;
        cameraAngles[0] += dy * sens_scale;
        cameraAngles[0] = clampf(cameraAngles[0], -89.9, 89.9);
        cameraAngles[1] += dx * sens_scale;
        cameraAngles[1] %= 360;
    }

    await loadText("/res/teapot.obj");
    const [tpVerts, tpInds] = readObjParts(getResource("/res/teapot.obj"));

    const t1 = loadTexture(gl, "/res/tile.png");
    await loadText("/res/textured_fragment.glsl");
    const fs = createShader(gl, gl.FRAGMENT_SHADER, getResource("/res/textured_fragment.glsl"));
    await loadText("/res/textured_vertex.glsl");
    const vs = createShader(gl, gl.VERTEX_SHADER, getResource("/res/textured_vertex.glsl"));
    await loadText("/res/untex_fragment.glsl");
    const nfs = createShader(gl, gl.FRAGMENT_SHADER, getResource("/res/untex_fragment.glsl"));
    await loadText("/res/untex_vertex.glsl");
    const nvs = createShader(gl, gl.VERTEX_SHADER, getResource("/res/untex_vertex.glsl"));
    const texturedEntityProgram = new Program(gl, vs, fs, function(gl, args) {
        gl.enableVertexAttribArray(this.attribs.pos);
        gl.enableVertexAttribArray(this.attribs.uv);
        gl.activeTexture(gl.TEXTURE0 + 0);
        gl.bindTexture(gl.TEXTURE_2D, args.texture);
        gl.uniform1i(this.uniforms.sampler, 0);

        gl.vertexAttribPointer(this.attribs.pos , 3, gl.FLOAT, false, 5*4, 0);
        gl.vertexAttribPointer(this.attribs.uv, 2, gl.FLOAT, false, 5*4, 3*4);
    });
    texturedEntityProgram.bindAttribute("a_position", "pos");
    texturedEntityProgram.bindAttribute("a_uv", "uv");
    texturedEntityProgram.bindUniform("u_sampler", "sampler");

    // eslint-disable-next-line no-unused-vars
    const nudeEntityProgram = new Program(gl, nvs, nfs, function(gl, args) {
        gl.enableVertexAttribArray(this.attribs.pos);
        gl.vertexAttribPointer(this.attribs.pos , 3, gl.FLOAT, false, 5*4, 0);
    });
    texturedEntityProgram.bindAttribute("a_position", "pos");

    const cubeDraw = new Renderable(gl, cubeVerts, cubeIndices, texturedEntityProgram, gl.TRIANGLE_STRIP);
    cubeDraw.setArg("texture", t1);
    cubeDraw.setArg("col", vec4.fromValues(1.0, 0.8, 0.6, 1.0));

    const tpDraw = new Renderable(gl, tpVerts, tpInds, nudeEntityProgram, gl.TRIANGLES);
    tpDraw.setArg("col", vec4.fromValues(1.0, 0.8, 0.6, 1.0));

    const viewMatrix = mat4.create();
    const up = vec3.fromValues(0, 1, 0);
    
    const entities = [];
    const makeEntity = (r, x, y, z, u) => {
        const e = new Entity();
        e.renderable = r;
        e.update = u;
        e.translate = [x,y,z];
        entities.push(e);
    };

    for (let i = 0; i < 100; i++) {
        const rx = Math.random() * 100 - 50;
        const rz = Math.random() * 50 - 25;
        const ry = Math.random() * 100 - 50;
        const rotx = Math.random() * 160 - 80;
        const roty = Math.random() * 160 - 80;
        const rotz = Math.random() * 160 - 80;
        let rr = cubeDraw;
        const rnd = Math.random();
        if ( rnd < 0.5 ) {
            rr = tpDraw;
        } 
        makeEntity(rr, rx, ry, rz, function(dt) {
            this.rotate[0] += rotx*dt;
            this.rotate[1] += roty*dt;
            this.rotate[2] += rotz*dt;
        });
    }

    function renderGlScene(gl, viewMatrix, dt) {
        vec3.set(cameraOffset, 0, 0, -1);

        quat.fromEuler(cameraRotQuat, cameraAngles[0], cameraAngles[1], 0);
        vec3.set(cameraOffset, 0, 0, -1);
        vec3.transformQuat(cameraOffset, cameraOffset, cameraRotQuat);
        vec3.add(cameraTgt, cameraPos, cameraOffset); 
        mat4.lookAt(viewMatrix, cameraPos, cameraTgt, up);
        gl.clear(gl.COLOR_BUFFER_BIT);
        for (let e of entities) {
            e.update(dt);
            e.draw(gl, viewMatrix, projMatrix);
        }

        quat.fromEuler(cameraRotQuat, 0, cameraAngles[1], 0);
        vec3.set(cameraFwd, 0, 0, -1);
        vec3.transformQuat(cameraFwd, cameraFwd, cameraRotQuat);
        const dcam = vec3.create();
        vec3.rotateY(cameraOrtho, cameraFwd, V3_Y, 1.57);
        if (EV.FWD == 1) {
            vec3.add(dcam, dcam, cameraFwd);
        }
        if (EV.BACK == 1) {
            vec3.sub(dcam, dcam, cameraFwd);
        }
        if (EV.LEFT == 1) {
            vec3.add(dcam, dcam, cameraOrtho);
        }
        if (EV.RIGHT == 1) {
            vec3.sub(dcam, dcam, cameraOrtho);
        }
        vec3.normalize(dcam, dcam);
        vec3.scale(dcam, dcam, 6.2*dt);
        cameraPos[0] += dcam[0];
        cameraPos[2] += dcam[2];

    }

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.clearColor(0.2, 0.5, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    gl.enable(gl.DEPTH_TEST);

    let then = 0;
    let avgCounter = 0;
    let avgSum = 0;
    function render(now) {
        now *= 0.001;
        const dt = now - then;
        avgSum += dt;
        then = now;
        renderGlScene(gl, viewMatrix, dt);
        avgCounter += 1;
        if (avgSum > 1) {
            console.log(1/ (avgSum / avgCounter));
            console.log(cameraFwd);
            console.log(cameraOrtho);
            avgSum = 0;
            avgCounter = 0;
        }
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}());