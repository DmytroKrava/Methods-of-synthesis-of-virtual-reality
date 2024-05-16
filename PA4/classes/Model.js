// Constructor
class Model {
    constructor(name) {
        this.name = name;
        this.iVertexBuffer = gl.createBuffer();
        this.iVertexBufferOfNormal = gl.createBuffer();
        this.iVertexBufferOfTexCoord = gl.createBuffer();
        this.count = 0;
    }

    BufferData = function (vertices, normals, texCoords) {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBufferOfTexCoord);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STREAM_DRAW);

        this.count = vertices.length / 3;
    }

    Draw = function () {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBufferOfTexCoord);
        gl.vertexAttribPointer(shProgram.iAttribTexCoord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribTexCoord);

        gl.drawArrays(gl.TRIANGLES, 0, this.count);
    }
    DrawWithLines = function () {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBufferOfTexCoord);
        gl.vertexAttribPointer(shProgram.iAttribTexCoord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribTexCoord);

        gl.uniform4fv(shProgram.iColor, [0, 0, 0, 1]);
        gl.drawArrays(gl.LINE_STRIP, 0, this.count);
        gl.uniform4fv(shProgram.iColor, [1, 1, 0, 1]);
        gl.drawArrays(gl.TRIANGLES, 0, this.count);
    }
}