import { loadText, getResource, loadTexture } from "./resource";
import { mat4, vec3, quat } from "./gl-matrix/gl-matrix.js";
import { drawEntity, Renderable, Entity, bindEntityProgram } from "./entity";

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

const cubeIndices = new Uint8Array([
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

    const t1 = loadTexture(gl, "/res/tile.png");
    await loadText("/res/fragment.glsl");
    const fs = createShader(gl, gl.FRAGMENT_SHADER, getResource("/res/fragment.glsl"));
    await loadText("/res/vertex.glsl");
    const vs = createShader(gl, gl.VERTEX_SHADER, getResource("/res/vertex.glsl"));
    const program = createShaderProgram(gl, vs, fs);
    bindEntityProgram(gl, program);

    const r = new Renderable(gl, cubeVerts, cubeIndices, t1, gl.TRIANGLE_STRIP);

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
        makeEntity(r, rx, ry, rz, function(dt) {
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
            drawEntity(gl, e, viewMatrix, projMatrix);
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