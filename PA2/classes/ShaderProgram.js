// Constructor
class ShaderProgram {
    constructor(name, program) {
        this.name = name;
        this.prog = program;

        // Location of the attribute variable in the shader program.
        this.iAttribVertex = -1;
        // Location of the uniform specifying a color for the primitive.
        this.iColor = -1;
        // Location of the uniform matrix representing the combined transformation.
        this.iModelViewProjectionMatrix = -1;
    }
    Use = function () {
        gl.useProgram(this.prog);
    }
}