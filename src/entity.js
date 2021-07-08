import {quat, vec3, vec4, mat4 } from "./gl-matrix/gl-matrix.js";

var entityProgram = -1;
var posAttrib = -1;
var uvAttrib =  -1;
var uniformCol = -1;
var uModel = -1;
var uProject = -1;
var uView =  -1;
var textureSamplerU = -1;

export function bindEntityProgram(gl, p) {
    entityProgram = p;
    posAttrib = gl.getAttribLocation(p, "a_position");
    uvAttrib = gl.getAttribLocation(p, "a_uv");
    uniformCol = gl.getUniformLocation(p, "u_col");
    uModel = gl.getUniformLocation(p, "u_modelMat");
    uProject = gl.getUniformLocation(p, "u_projMat");
    uView = gl.getUniformLocation(p, "u_viewMat");
    textureSamplerU = gl.getUniformLocation(p, "u_sampler");
}

export class Entity {
    constructor() {
        this.renderable = null;
        // eslint-disable-next-line no-unused-vars
        this.translate = vec3.fromValues(1.0, 1.0, 1.0);
        this.scale = vec3.fromValues(1.0, 1.0, 1.0);
        this.rotate = vec3.fromValues(0.0, 0.0, 0.0);
        this.qr = quat.create();
    }
    // eslint-disable-next-line no-unused-vars
    update(dt) {}
}

export function drawEntity(gl, e, camera, proj) {
    if ( e.renderable === null ) {
        return;
    }

    const modelTransform = mat4.create();
    quat.fromEuler(e.qr, e.rotate[0], e.rotate[1], e.rotate[2]);
    mat4.fromRotationTranslationScale(modelTransform, e.qr, e.translate, e.scale);

    gl.useProgram(entityProgram);

    gl.uniform4fv(uniformCol, e.renderable.col);
    gl.uniformMatrix4fv(uModel, false, modelTransform);
    gl.uniformMatrix4fv(uProject, false, proj);
    gl.uniformMatrix4fv(uView, false, camera);

    gl.bindBuffer(gl.ARRAY_BUFFER, e.renderable.vertexBuffer);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, e.renderable.elementBuffer);

    gl.enableVertexAttribArray(posAttrib);
    gl.enableVertexAttribArray(uvAttrib);
    gl.activeTexture(gl.TEXTURE0 + 0);
    gl.bindTexture(gl.TEXTURE_2D, e.renderable.texture);
    gl.uniform1i(textureSamplerU, 0);

    gl.vertexAttribPointer(posAttrib, 3, gl.FLOAT, false, 5*4, 0);
    gl.vertexAttribPointer(uvAttrib, 2, gl.FLOAT, false, 5*4, 3*4);

    gl.drawElements(e.renderable.vertexDataType, 14, gl.UNSIGNED_BYTE, 0);
}

export class Renderable {
    constructor(gl, vb, eb, tex, type) {
        this.texture = tex;
        this.vertexDataType = type;
        this.col = vec4.fromValues(1.0, 1.0, 1.0, 1.0);
        this.vertexBuffer = gl.createBuffer();
        this.elementBuffer = gl.createBuffer();
        this.elementBufferLength = eb.length;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vb, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.elementBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, eb, gl.STATIC_DRAW);
    }

    delete(gl) {
        gl.deleteBuffer(this.vertexBuffer);
        gl.deleteBuffer(this.elementBuffer);
    }
}