'use strict';

let gl;                         // The webgl context.
let surface;                    // A surface model
let shProgram;                  // A shader program
let spaceball;                  // A SimpleRotator object that lets the user rotate the view by mouse.
let video, texture, backgroundModel;

function deg2rad(angle) {
    return angle * Math.PI / 180;
}

let timestamp,
    gyroscope,
    xG,
    yG,
    zG,
    gyroMat,
    gyroStart = false,
    alpha = 0,
    beta = 0,
    gamma = 0;
const E = 0.001
const MS2S = 1.0 / 1000.0;
// some constants

function readGyroscope() {
    timestamp = Date.now();
    gyroscope = new Gyroscope();
    gyroscope.addEventListener('reading', () => {
        timestamp = Date.now();
        xG = gyroscope.x
        yG = gyroscope.y
        zG = gyroscope.z
        gyroscopeToRotationMatrix()
    })
    gyroscope.start();
    gyroStart = true
    anim()

}

function getRotationMatrixFromVector(rotationVector) {
    const q1 = rotationVector[0];
    const q2 = rotationVector[1];
    const q3 = rotationVector[2];
    let q0;

    if (rotationVector.length >= 4) {
        q0 = rotationVector[3];
    } else {
        q0 = 1 - q1 * q1 - q2 * q2 - q3 * q3;
        q0 = q0 > 0 ? Math.sqrt(q0) : 0;
    }
    const sq_q1 = 2 * q1 * q1;
    const sq_q2 = 2 * q2 * q2;
    const sq_q3 = 2 * q3 * q3;
    const q1_q2 = 2 * q1 * q2;
    const q3_q0 = 2 * q3 * q0;
    const q1_q3 = 2 * q1 * q3;
    const q2_q0 = 2 * q2 * q0;
    const q2_q3 = 2 * q2 * q3;
    const q1_q0 = 2 * q1 * q0;
    let R = [];
    R.push(1 - sq_q2 - sq_q3);
    R.push(q1_q2 - q3_q0);
    R.push(q1_q3 + q2_q0);
    R.push(0.0);
    R.push(q1_q2 + q3_q0);
    R.push(1 - sq_q1 - sq_q3);
    R.push(q2_q3 - q1_q0);
    R.push(0.0);
    R.push(q1_q3 - q2_q0);
    R.push(q2_q3 + q1_q0);
    R.push(1 - sq_q1 - sq_q2);
    R.push(0.0);
    R.push(0.0);
    R.push(0.0);
    R.push(0.0);
    R.push(1.0);
    return R;
}

function gyroscopeToRotationMatrix() {
    if (xG !== null) {
        let dT = (Date.now() - timestamp) * MS2S;

        let omegaMagnitude = Math.sqrt(xG * xG + yG * yG + zG * zG);

        if (omegaMagnitude > E) {
            alpha += xG * dT;
            beta += yG * dT;
            gamma += zG * dT;

            alpha = Math.min(Math.max(alpha, -Math.PI * 0.25), Math.PI * 0.25)
            beta = Math.min(Math.max(beta, -Math.PI * 0.25), Math.PI * 0.25)
            gamma = Math.min(Math.max(gamma, -Math.PI * 0.25), Math.PI * 0.25)
            let deltaRotationVector = [];
            deltaRotationVector.push(alpha);
            deltaRotationVector.push(beta);
            deltaRotationVector.push(gamma);

            gyroMat = getRotationMatrixFromVector(deltaRotationVector)
            timestamp = Date.now();

        }

    }
}
/* Draws a colored cube, along with a set of coordinate axes.
 * (Note that the use of the above drawPrimitive function is not an efficient
 * way to draw with WebGL.  Here, the geometry is so simple that it doesn't matter.)
 */
function draw() {

    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    /* Set the values of the projection transformation */
    let projection = m4.perspective(Math.PI / 8, 1, 8, 12);

    /* Get the view matrix from the SimpleRotator object.*/
    let modelView = spaceball.getViewMatrix();

    let rotateToPointZero = m4.axisRotation([0.707, 0.707, 0], 0.7);
    let translateToPointZero = m4.translation(0, 0, -10);

    let matAccum0 = m4.multiply(rotateToPointZero, modelView);
    let matAccum1 = m4.multiply(translateToPointZero, matAccum0);

    /* Multiply the projection matrix times the modelview matrix to give the
       combined transformation matrix, and send that to the shader program. */
    let modelViewProjection = m4.multiply(projection, matAccum1);
    // gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, modelViewProjection);
    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, m4.identity());
    gl.uniform1f(shProgram.iBool, true);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        video
    );
    backgroundModel.Draw()
    gl.uniform1f(shProgram.iBool, false);
    gl.clear(gl.DEPTH_BUFFER_BIT);

    /* Draw the six faces of a cube, with different colors. */
    gl.uniform4fv(shProgram.iColor, [1, 1, 0, 1]);
    stereoCamera.ApplyLeftFrustum()
    gyroscopeToRotationMatrix()
    modelViewProjection = m4.multiply(stereoCamera.projection, m4.multiply(stereoCamera.modelView, matAccum1));
    if (gyroStart) {
        modelViewProjection = m4.multiply(stereoCamera.projection, m4.multiply(stereoCamera.modelView, m4.multiply(matAccum1, gyroMat)));
    }
    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, modelViewProjection);

    gl.colorMask(true, false, false, false);
    surface.DrawWithLines();
    gl.clear(gl.DEPTH_BUFFER_BIT);

    stereoCamera.ApplyRightFrustum()
    modelViewProjection = m4.multiply(stereoCamera.projection, m4.multiply(stereoCamera.modelView, matAccum1));
    if (gyroStart) {
        modelViewProjection = m4.multiply(stereoCamera.projection, m4.multiply(stereoCamera.modelView, m4.multiply(matAccum1, gyroMat)));
    }
    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, modelViewProjection);
    gl.colorMask(false, true, true, false);
    surface.DrawWithLines();
    gl.colorMask(true, true, true, true);
}
function anim() {

    draw()
    if (gyroStart)
        window.requestAnimationFrame(anim)
}
function CreateSurfaceData() {
    let points = new Array();
    let norms = new Array();
    let texCos = new Array();

    let aMax = 360;
    let tMax = 20;
    let aStep = 15;
    let tStep = 0.5;
    let r = 1.4;
    let c = 1.4;
    let d = 1.4;
    let phi = 3.14 / 2;
    let alpha0 = 0;
    let pi = 3.14;
    let surfaceFormula = (a, t) => {
        let x = r * Math.cos(deg2rad(a)) - (r * (deg2rad(alpha0) - deg2rad(a)) + t * Math.cos(phi)
            - c * Math.sin(d * t) * Math.sin(phi)) * Math.sin(deg2rad(a));

        let y = r * Math.sin(deg2rad(a)) + (r * (deg2rad(alpha0) - deg2rad(a)) + t * Math.cos(phi)
            - c * Math.sin(d * t) * Math.sin(phi)) * Math.cos(deg2rad(a));

        let z = t * Math.sin(phi) + c * Math.sin(deg2rad(d * t)) * Math.cos(phi);
        return [0.1 * x, 0.1 * y, 0.1 * z];
    }

    let normalAnalyticCalculation = (a, t) => {
        const eps = 0.001;
        let [u11, u12, u13] = surfaceFormula(a, t);
        let [v11, v12, v13] = [u11, u12, u13];
        let [u21, u22, u23] = surfaceFormula(a + eps, t);
        let [v21, v22, v23] = surfaceFormula(a, t + eps);
        let dU = new Array((u11 - u21) / eps,
            (u12 - u22) / eps,
            (u13 - u23) / eps
        );
        let dV = new Array((v11 - v21) / eps,
            (v12 - v22) / eps,
            (v13 - u23) / eps
        );

        return m4.normalize(m4.cross(dU, dV));
    }

    for (let a = 0; a <= aMax; a += aStep) {
        for (let t = 0; t <= tMax; t += tStep) {
            let a1 = [a, a + aStep, a, a, a + aStep, a + aStep];
            let t1 = [t, t, t + tStep, t + tStep, t, t + tStep];
            for (let i = 0; i < a1.length; i++) {
                points.push(...surfaceFormula(a1[i], t1[i]));
                norms.push(...normalAnalyticCalculation(a1[i], t1[i]));
                texCos.push(a1[i] / aMax, t1[i] / tMax)
            }
        }
    }

    return [points, norms, texCos];
}

let ui;
/* Initialize the WebGL context. Called from init() */
function initGL() {
    video = getVideo();
    ui = new dat.GUI();
    console.log(ui)
    console.log(stereoCamera)
    ui.add(stereoCamera, "mConvergence", 10, 500, 5).onChange(draw)
    ui.add(stereoCamera, "mEyeSeparation", 0, 2, 0.01).onChange(draw)
    ui.add(stereoCamera, "mFOV", 0.05, 1.5, 0.01).onChange(draw)
    ui.add(stereoCamera, "mNearClippingDistance", 5, 15, 0.5).onChange(draw)
    let prog = createProgram(gl, vertexShaderSource, fragmentShaderSource);

    shProgram = new ShaderProgram('Basic', prog);
    shProgram.Use();

    shProgram.iAttribVertex = gl.getAttribLocation(prog, "vertex");
    shProgram.iAttribTexCoord = gl.getAttribLocation(prog, "texCoord");
    shProgram.iModelViewProjectionMatrix = gl.getUniformLocation(prog, "ModelViewProjectionMatrix");
    shProgram.iBool = gl.getUniformLocation(prog, "applyTexture");
    shProgram.iColor = gl.getUniformLocation(prog, "color");

    surface = new Model('Surface');
    surface.BufferData(...CreateSurfaceData());
    backgroundModel = new Model('Surface');
    backgroundModel.BufferData(
        [-1, -1, 0, 1, 1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, -1, 1, 0],
        [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
        [1, 1, 0, 0, 0, 1, 0, 0, 1, 1, 1, 0]
    );

    gl.enable(gl.DEPTH_TEST);
}



/* Creates a program for use in the WebGL context gl, and returns the
 * identifier for that program.  If an error occurs while compiling or
 * linking the program, an exception of type Error is thrown.  The error
 * string contains the compilation or linking error.  If no error occurs,
 * the program identifier is the return value of the function.
 * The second and third parameters are strings that contain the
 * source code for the vertex shader and for the fragment shader.
 */
function createProgram(gl, vShader, fShader) {
    let vsh = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vsh, vShader);
    gl.compileShader(vsh);
    if (!gl.getShaderParameter(vsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in vertex shader:  " + gl.getShaderInfoLog(vsh));
    }
    let fsh = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fsh, fShader);
    gl.compileShader(fsh);
    if (!gl.getShaderParameter(fsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in fragment shader:  " + gl.getShaderInfoLog(fsh));
    }
    let prog = gl.createProgram();
    gl.attachShader(prog, vsh);
    gl.attachShader(prog, fsh);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        throw new Error("Link error in program:  " + gl.getProgramInfoLog(prog));
    }
    return prog;
}


/**
 * initialization function that will be called when the page has loaded
 */
function init() {
    // readGyroscope()
    let canvas;
    try {
        canvas = document.getElementById("webglcanvas");
        gl = canvas.getContext("webgl");
        if (!gl) {
            throw "Browser does not support WebGL";
        }
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not get a WebGL graphics context.</p>";
        return;
    }
    try {
        initGL();  // initialize the WebGL graphics context
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not initialize the WebGL graphics context: " + e + "</p>";
        return;
    }
    texture = CreateTexture();
    spaceball = new TrackballRotator(canvas, draw, 0);

    draw();
    // anim();
}

function CreateTexture() {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return texture;
}

function getVideo() {
    const video = document.createElement('video');
    video.setAttribute('autoplay', true);
    navigator.getUserMedia({ video: true, audio: false }, function(stream) {
        video.srcObject = stream;
    }, function(e) {
        console.error('Rejected!', e);
    });
    return video
}
