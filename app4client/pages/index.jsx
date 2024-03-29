import { useCallback, useEffect, useRef, useState } from "react"

import styles from "../styles/index.module.css"
import Player from "@/components/player";

let gl, prog;

var particleSize = 5;

var mouseRadius = 60;

var comebackSpeed = 2.5;

var visualizerOn = false;

const getRandomInt = (min, max) => {
    return Math.floor(Math.random() * (Math.floor(max) - Math.ceil(min)) + Math.ceil(min));
}

const drawCircle = (context, x, y, radius, fillStyle) => {
    context.beginPath();
    context.arc(x, y, radius, 0, 2 * Math.PI, false);
    context.fillStyle = fillStyle;
    context.fill();
}

const createRadialGradient = (context, x, y, r, x1, y1, r1, color1, color2) => {
    let gradient = context.createRadialGradient(x, y, r, x1, y1, r1);
    gradient.addColorStop(0.3, color1);
    gradient.addColorStop(1, color2);
    return gradient;
}

const drawRadialGradientCircle = (context, x, y, r, color1, color2) => {
    const fillStyle = createRadialGradient(context, x, y, r, x, y, 0, color1, color2);
    drawCircle(context, x, y, r, fillStyle);
}

const drawGradientRectangle = (context, x, y, x1, y1, color, color1, t = true, s = false) => {
    const fillStyle = context.createLinearGradient(x < 0 ? 0 : x, y, t ? x : x1, t ? y1 : -y);
    if (s) {
        fillStyle.addColorStop(0, color1);
        fillStyle.addColorStop(.8, color);
    }
    else {
        fillStyle.addColorStop(.2, color);
        fillStyle.addColorStop(1, color1);
    }

    context.fillStyle = fillStyle;

    context.fillRect(x, y, x1, y1);
}

const normalizeVector = (vectorArray, multiplier = 1) => {
    let len = Math.sqrt(vectorArray[0] ** 2 + vectorArray[1] ** 2);

    if (len == 0) {
        return [0, 0];
    }

    let normalized = [(vectorArray[0] / len * multiplier), (vectorArray[1] / len * multiplier)];

    return normalized;
}

const average = (array) => {
    return array.reduce((a, b) => a + b, 0) / array.length;
}

let verticies = [];

const DrawRectGL = (canvas, posX, posY, size) => {
    if (gl) {
        const sizeLoc = gl.getUniformLocation(prog, "size");
        const locationLoc = gl.getUniformLocation(prog, "location");
        const canvasLoc = gl.getUniformLocation(prog, "canvas");


        gl.uniform2f(canvasLoc, canvas.width, canvas.height);
        gl.uniform2f(locationLoc, posX, posY);
        gl.uniform1f(sizeLoc, size);

        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    }
}


class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.velocity = [0, 0];
        this.center = [x + particleSize / 2, y + particleSize / 2];
        this.startPos = [x, y];
        this.comeback = false;
        this.color = "rgba(0, 0, 255, .2)";
    }

    draw = (canvas) => {
        // context.fillStyle = this.color;
        // context.fillRect(this.x, this.y, particleSize, particleSize);

        if (!this.comeback) {
            this.velocity[0] = this.move(this.velocity[0]);
            this.velocity[1] = this.move(this.velocity[1]);
        }

        if (this.velocity[0] != 0 && this.velocity[1] != 0) {
            this.x += this.velocity[0];
            this.y += this.velocity[1];

            this.center = [this.x + particleSize / 2, this.y + particleSize / 2];
        }

        if (this.velocity[0] == 0 && this.velocity[1] == 0 && this.x !== this.startPos[0] && this.y !== this.startPos[1]) {
            this.velocity = normalizeVector([this.startPos[0] - this.x, this.startPos[1] - this.y], 2);
            this.comeback = true;
        }

        if (this.comeback) {
            this.velocity = [(this.startPos[0] - this.x) / comebackSpeed, (this.startPos[1] - this.y) / comebackSpeed];
            if (Math.abs(this.velocity[0]) == 0 && Math.abs(this.velocity[1]) == 0) {
                this.comeback = false;
                this.x = this.startPos[0];
                this.y = this.startPos[1];
            }
        }

    }

    move = (velocity) => {
        if (velocity != 0 || !this.comeback) {
            velocity = (velocity - Math.sign(velocity) * .1);
            if (Math.abs(velocity) < .1)
                return 0;

        }
        return velocity;
    }
}

class Animator {

    constructor() {
        this.callbacks = [];
    }

    add = (callback) => {
        this.callbacks.push(callback);
    }

    startRendering = () => {
        const render = (() => {
            for (let i = 0; i < this.callbacks.length; i++)
                this.callbacks[i]();

            requestAnimationFrame(render);
        }).bind(this);


        requestAnimationFrame(render);
    }
}

let audioContext, analyser, dataArray, audioSource = null;

const animator = new Animator();

export default function Home() {
    let canvas = useRef();
    const [video, setVideo] = useState([]);
    const [particles, setParticles] = useState([]);

    const createParticles = useCallback(() => {
        let newParticles = [];
        for (let x = 0; x < window.innerWidth; x++) {
            for (let y = 0; y < window.innerHeight; y++) {
                newParticles.push(new Particle(x, y));
                verticies.push(x / canvas.current.width * 2 - 1);
                verticies.push(y / canvas.current.height * 2 - 1);
            }
        }
        setParticles(newParticles);
    }, []);

    const drawParticles = useCallback((canvasContexts) => {
        let i = particles.length;
        while (i--) {
            particles[i].draw(canvas.current);
        }

        const timeLoc = gl.getUniformLocation(prog, 'time');
        gl.uniform1f(timeLoc, performance.now() / 1000);
        gl.drawArrays(gl.POINTS, 0, particles.length);
    }, [particles.length]);


    const mouseMove = (e) => {
        // runFromMouse(e);
        if(gl) {
            const mouseLoc = gl.getUniformLocation(prog, 'mouse');
            gl.uniform2f(mouseLoc, e.clientX / canvas.current.width * 2 - 1, e.clientY / canvas.current.height * 2 - 1);
            // console.log("Pos: ", e.clientX / canvas.current.width * 2 - 1, e.clientY / canvas.current.height * 2 - 1);
        }
        // if (gl) {
        // const locationLoc = gl.getUniformLocation(prog, "location");
        // gl.uniform2f(locationLoc, e.clientX, e.clientY);
        // gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
        // }
    }

    const runFromMouse = (e) => {
        let i = particles.length;
        while (i--) {
            if (Math.abs(particles[i].center[0] - e.clientX) ** 2 + Math.abs(particles[i].center[1] - e.clientY) ** 2 < mouseRadius ** 2) {
                particles[i].velocity = normalizeVector([particles[i].center[0] - e.clientX, particles[i].center[1] - e.clientY], 5);
                particles[i].comeback = false;
            }
        }
    }

    const runFromPosition = (position, radius = 20) => {
        let i = particles.length;
        while (i--) {
            if (Math.abs(particles[i].center[0] - position[0]) ** 2 + Math.abs(particles[i].center[1] - position[1]) ** 2 < radius ** 2) {
                particles[i].velocity = normalizeVector([particles[i].center[0] - position[0], particles[i].center[1] - position[1]], 5);
                particles[i].comeback = false;
            }
        }
    }

    const startRendering = (canvasContext) => {
        let render = () => {
            if (gl)
                gl.clear(gl.COLOR_BUFFER_BIT);
            drawParticles(canvasContext);
        }
        animator.add(render);
    }

    const startAnalysing = () => {
        audioContext = new AudioContext();


        audioSource = audioContext.createMediaElementSource(video[0].current);
        let audioSource2 = audioContext.createMediaElementSource(video[1].current);
        analyser = audioContext.createAnalyser();
        audioSource2.connect(analyser);
        audioSource.connect(analyser);
        analyser.connect(audioContext.destination);

        analyser.fftSize = 128;
        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
    }

    const activateContext = () => {
        if (audioContext) {
            if (audioContext.state === "suspended") {
                audioContext.resume();
            }
        }
    }

    useEffect(() => {
        canvas.current.width = window.innerWidth + 10;
        canvas.current.height = window.innerHeight;

        createParticles();

        animator.startRendering();
    }, [])

    useEffect(() => {
        console.log(particles.length);
        // let canvasContext = canvas.current.getContext("2d");
        if (particles.length > 0) {
            gl = canvas.current.getContext("webgl2");
            gl.viewport(0, 0, canvas.current.width, canvas.current.height);

            gl.clearColor(0, 0, 0, 0);

            gl.clear(gl.COLOR_BUFFER_BIT);


            const vertexShader = `#version 300 es
        precision mediump float;

        in vec2 vertexPos;

        uniform float time;
        uniform vec2 mouse;

        void main() {
            vec2 pos = vec2(vertexPos.x, -vertexPos.y);
            vec2 cMouse = vec2(mouse.x, -mouse.y);
            if(distance(pos, cMouse) < .2) {
                pos -= cMouse;
            }
            gl_Position = vec4(pos, 1.0, 1.0);
            gl_PointSize = 1.0;
        }
        `;

            const fragmentShader = `#version 300 es
        precision mediump float;
    
        out vec4 outputColor;

        uniform float time;
        uniform vec2 mouse;

        void main() {
            outputColor = vec4(mouse - vec2(0.0, 0.0), 1.0 - cos(time), 1.0);
        }
        `;

            const vs = gl.createShader(gl.VERTEX_SHADER);
            gl.shaderSource(vs, vertexShader);
            gl.compileShader(vs);

            console.error(gl.getShaderInfoLog(vs));


            const fs = gl.createShader(gl.FRAGMENT_SHADER);
            gl.shaderSource(fs, fragmentShader);
            gl.compileShader(fs);


            console.error(gl.getShaderInfoLog(fs));


            prog = gl.createProgram();
            gl.attachShader(prog, vs);
            gl.attachShader(prog, fs);
            gl.linkProgram(prog);
            if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
                console.error(gl.getProgramInfoLog(prog));
            }

            const vertexPositionAttrLoc = gl.getAttribLocation(prog, 'vertexPos');
            const timeLoc = gl.getUniformLocation(prog, 'time');

            gl.useProgram(prog);
            gl.enableVertexAttribArray(vertexPositionAttrLoc);

            const buffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verticies), gl.STATIC_DRAW);

            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.vertexAttribPointer(
                vertexPositionAttrLoc,
                2,
                gl.FLOAT,
                false,
                0,
                0
            );

            gl.uniform1f(timeLoc, performance.now());

            // gl.drawArrays(gl.POINTS, 0, particles.length);
            startRendering(gl);
        }
    }, [particles.length])

    useEffect(() => {
        if (video.length > 0) {
            startAnalysing();
        }
    }, [video])

    return (
        <div className={styles.main} onMouseMove={mouseMove}>
            <Player setVideo={setVideo} activateContext={activateContext} />

            <canvas width={1000} height={1000} ref={canvas} onClick={() => {
                if (!visualizerOn) {
                    visualizerOn = true;
                    const barWidth = canvas.current.width / analyser.frequencyBinCount;
                    audioContext.resume();
                    let canvasContext = canvas.current.getContext("2d");
                    let nextExplosion = [window.innerWidth / 2, window.innerHeight];
                    let next = 0;
                    let uprise = false;
                    let last01 = 0;
                    let last13 = 0;

                    const a = () => {
                        analyser.getByteFrequencyData(dataArray)

                        comebackSpeed = 5 - average(dataArray.slice(5, 40)) / 255 * 4.5;


                        // dataArray.forEach((data, i) => {
                        // 	canvasContext.fillStyle = "rgba(0, 0, 255, " + data / 255 * .5 + ")";
                        // 	canvasContext.fillRect(barWidth * i, 0, barWidth, data / 255 * canvas.current.height);
                        // 	canvasContext.fillStyle = "#000";
                        // 	canvasContext.fillText(i.toString(), barWidth * i, 20)
                        // })

                        let bass = average(dataArray.slice(43, 52));
                        let highBass = average(dataArray.slice(38, 42))
                        let lowBass = average(dataArray.slice(53, 63));
                        let mediumBass = average(dataArray.slice(12, 25)) / 255;
                        drawGradientRectangle(canvasContext, 0, canvas.current.height - 150, canvas.current.width, canvas.current.height + 150, "rgba(0, 0, 0, 0)", "rgba(0, " + (lowBass + 50) + ", 255, " + (highBass + bass) / 255 + ")");

                        drawGradientRectangle(canvasContext, canvas.current.width + 50 - mediumBass * 300, 0, canvas.current.width + 250, canvas.current.height, "rgba(0, 0, 255, " + mediumBass * 0.8 + ")", "rgba(0, 0, 0, 0)", false, true);
                        drawGradientRectangle(canvasContext, 0, 0, mediumBass * 300 - 50, canvas.current.height, "rgba(0, 0, 255, " + mediumBass * 0.35 + ")", "rgba(0, 0, 0, 0)", false);

                        // let sinCosMultiplier = average(dataArray.slice(10, 55)) / 255 * 1.4;

                        let radiusO = average(dataArray.slice(0, 20)) / 255 * 80;
                        // x - 0, 5, 20, 25-30
                        // y - 0-5, 6-25, 21, 30-35, 43-56
                        let pos = [
                            (dataArray[0] - dataArray[20] + dataArray[5] ** 3 / 255 ** 2 - average(dataArray.slice(25, 30)) ** 2 / 255) / 255 * window.innerWidth,
                            (dataArray[1] - dataArray[21] + average(dataArray.slice(43, 56)) + average(dataArray.slice(30, 35)) ** 3 / 255 ** 2 - average(dataArray.slice(0, 5)) / 5 - Math.max(average(dataArray.slice(6, 25)) ** 2, average(dataArray.slice(30, 40)) ** 2) / 255 / 10) / 255 * window.innerHeight
                        ]
                        runFromPosition([pos[0], pos[1]], radiusO);
                        runFromPosition([window.innerWidth - pos[0], window.innerHeight - pos[1]], radiusO);
                        runFromPosition([pos[0], window.innerHeight - pos[1]], radiusO);
                        runFromPosition([window.innerWidth - pos[0], pos[1]], radiusO);

                        let leftRightCircles = average(dataArray.slice(10, 40)) / 255;
                        drawRadialGradientCircle(canvasContext, 0, canvas.current.height, 350, "rgba(0, 0, 0, 0)", "rgba(0, 0, " + leftRightCircles * 255 + ", " + leftRightCircles + ")");
                        drawRadialGradientCircle(canvasContext, canvas.current.width, canvas.current.height, 350, "rgba(0, 0, 0, 0)", "rgba(0, 0, " + leftRightCircles * 255 + ", " + leftRightCircles + ")");

                        if ((average(dataArray.slice(0, 1)) - last01 > 22 || average(dataArray.slice(1, 3)) - last13 > 24) && !uprise) {
                            uprise = true;
                            runFromPosition(nextExplosion);
                            runFromPosition(nextExplosion);
                        }

                        if (uprise) {
                            if (nextExplosion[0] >= 0 && next == 0)
                                nextExplosion[0] -= 70;
                            if (nextExplosion[0] < 0) {
                                nextExplosion[0] = -1;
                                nextExplosion[1] -= 70;
                                next = 1;
                            }
                            if (nextExplosion[1] < 0 && next == 1) {
                                nextExplosion[1] = -1;
                                nextExplosion[0] += 70;
                            }

                            if (nextExplosion[0] > window.innerWidth / 2 && next == 1) {
                                uprise = false;
                                next = 0;
                                nextExplosion = [window.innerWidth / 2, window.innerHeight];
                            }

                            runFromPosition(nextExplosion);
                            runFromPosition([window.innerWidth - nextExplosion[0], nextExplosion[1]]);


                        }

                        last01 = average(dataArray.slice(0, 1));
                        last13 = average(dataArray.slice(1, 3));


                    }

                    animator.add(a);
                }

            }}></canvas>
        </div>
    )
}
