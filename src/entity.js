import {quat, vec3, mat4 } from "./gl-matrix/gl-matrix.js";

export class Entity {
    constructor() {
        this.renderable = null;
        // eslint-disable-next-line no-unused-vars
        this.translate = vec3.fromValues(1.0, 1.0, 1.0);
        this.scale = vec3.fromValues(1.0, 1.0, 1.0);
        this.rotate = vec3.fromValues(0.0, 0.0, 0.0);
        this.qr = quat.create();
        this.modelMatrix = mat4.create();
    }
    // eslint-disable-next-line no-unused-vars
    update(dt) {}
    draw(gl, camera, proj) {
        quat.fromEuler(this.qr, this.rotate[0], this.rotate[1], this.rotate[2]);
        mat4.fromRotationTranslationScale(this.modelMatrix, this.qr, this.translate, this.scale);
        this.renderable.draw(gl, this.modelMatrix, camera, proj);
    }
}

