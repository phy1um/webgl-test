// an attribute will receive data from a buffer
attribute vec4 a_position;
uniform mat4 u_modelMat;
uniform mat4 u_projMat;
uniform mat4 u_viewMat;

// all shaders have a main function
void main() {
    
    // gl_Position is a special variable a vertex shader
    // is responsible for setting
    vec4 posn = u_projMat * u_viewMat * u_modelMat * a_position;
    gl_Position = posn;
}