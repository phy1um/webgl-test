export class Renderable {
    constructor(gl, vb, eb, prog, type) {
        this.vertexDataType = type;
        this.vertexBuffer = gl.createBuffer();
        this.elementBuffer = gl.createBuffer();
        this.elementBufferLength = eb.length;
        this.program = prog;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vb, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.elementBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, eb, gl.STATIC_DRAW);
        this.args = {};
    }

    draw(gl, m, v, p) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.elementBuffer);
        this.program.bind(this.args);
        gl.uniform4fv(this.program.uniform_colour, this.args.col);
        gl.uniformMatrix4fv(this.program.uniform_model, false, m);
        gl.uniformMatrix4fv(this.program.uniform_proj, false, p);
        gl.uniformMatrix4fv(this.program.uniform_view, false, v);
        gl.drawElements(this.vertexDataType, this.elementBufferLength, gl.UNSIGNED_SHORT, 0); 
    }

    delete(gl) {
        gl.deleteBuffer(this.vertexBuffer);
        gl.deleteBuffer(this.elementBuffer);
    }

    setArg(k, v) {
        this.args[k] = v;
    }
}

export class Program {
    constructor(gl, vf, ff, binder) {
        const prog = gl.createProgram();
        gl.attachShader(prog, vf);
        gl.attachShader(prog, ff);
        gl.linkProgram(prog);
        const res = gl.getProgramParameter(prog, gl.LINK_STATUS);
        if (!res) {
            console.error("Failed to create shader program!");
            console.error(gl.getProgramInfoLog(prog));
            gl.deleteProgram(prog);
        }
        this.program = prog;
        this._inner_bind = binder;
        this.gl = gl;
        this.attribs = {};
        this.uniforms = {};
        this.uniform_colour = gl.getUniformLocation(prog, "u_col");
        this.uniform_model = gl.getUniformLocation(prog, "u_modelMat");
        this.uniform_proj = gl.getUniformLocation(prog, "u_projMat");
        this.uniform_view = gl.getUniformLocation(prog, "u_viewMat");
    }
    
    bind(args) {
        this.gl.useProgram(this.program);
        this._inner_bind(this.gl, args);
    }

    bindAttribute(attrib, name) {
        this.attribs[name] = this.gl.getAttribLocation(this.program, attrib);
    }

    bindUniform(uniform, name) {
        this.uniforms[name] = this.gl.getUniformLocation(this.program, uniform);
    }
}


