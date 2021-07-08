// fragment shaders don't have a default precision so we need
// to pick one. mediump is a good default. It means "medium precision"
precision mediump float;

uniform vec4 u_col;
uniform sampler2D u_sampler;

varying vec2 f_uv;
    
void main() {
    // gl_FragColor is a special variable a fragment shader
    // is responsible for setting
    gl_FragColor = u_col * texture2D(u_sampler, f_uv);
}