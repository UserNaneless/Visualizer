export class WebGL {
    gl: WebGL2RenderingContext | null = null
    prog: WebGLProgram | null = null


    vertexShader = `#version 300 es
    
    uniform float uPointSize;
    uniform vec2 uMousePos;
    uniform vec2 uResolution;

    out float dist;

    layout(location = 0) in vec2 aPosition;

    vec2 toScreen(vec2 pos) {
        vec2 newPos = (pos / uResolution) * 2.0 - 1.0;
        return vec2(newPos.x, -newPos.y);
    }

    void main() {

        dist = distance(aPosition, uMousePos);
        gl_Position = vec4(toScreen(aPosition), 0.0, 1.0);
        gl_PointSize = uPointSize;
    } 

    `

    fragmentShader = `#version 300 es
    precision highp float;
   
    uniform vec2 uMousePos;

    in float dist;

    out vec4 fragColor;

    void main() {
        if(dist < 100.0) {
            fragColor = vec4(0.0, 1.0, 0.0, 1.0);
        }
        else {
            fragColor = vec4(1.0, 0.0, 0.0, 1.0);
        }
    }

    `
    uPointSize: WebGLUniformLocation | null = null
    uMousePos: WebGLUniformLocation | null = null
    uResolution: WebGLUniformLocation | null = null
    aPosition = 0;

    bufferData: Float32Array = new Float32Array([

    ]);

    constructor() {
        return this;
    }

    setContext(gl: WebGL2RenderingContext) {
        this.gl = gl
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        return this;
    }

    createParticles() {
        const p = [];
        for (let y = 0; y <= window.innerHeight; y += 1) {
            for (let x = 0; x <= window.innerWidth; x += 1) {
                p.push(x, y)
            }
        }

        this.bufferData = new Float32Array(p);
        return this;
    }

    setup() {
        this.createParticles();
        this.gl = this.gl!;
        const prog = this.gl.createProgram();

        if (prog) {
            const vert = this.gl.createShader(this.gl.VERTEX_SHADER);
            const frag = this.gl.createShader(this.gl.FRAGMENT_SHADER);
            if (vert && frag) {
                this.gl.shaderSource(vert, this.vertexShader);
                this.gl.compileShader(vert);
                this.gl.attachShader(prog, vert);

                this.gl.shaderSource(frag, this.fragmentShader);
                this.gl.compileShader(frag);
                this.gl.attachShader(prog, frag);

                this.gl.linkProgram(prog)
                if (!this.gl.getProgramParameter(prog, this.gl.LINK_STATUS)) {
                    console.log(this.gl.getShaderInfoLog(frag))
                    console.log(this.gl.getShaderInfoLog(vert))
                    console.log(this.gl.getProgramInfoLog(prog))
                }

                this.gl.useProgram(prog);
                this.prog = prog;
                this.gl.clearColor(1, 1, 1, 1)


                this.uPointSize = this.gl.getUniformLocation(this.prog, 'uPointSize');
                this.gl.uniform1f(this.uPointSize, 1);

                this.uResolution = this.gl.getUniformLocation(this.prog, 'uResolution');
                this.gl.uniform2f(this.uResolution, window.innerWidth, window.innerHeight);;

                this.uMousePos = this.gl.getUniformLocation(this.prog, 'uMousePos');

                this.aPosition = this.gl.getAttribLocation(this.prog, 'aPosition');
                this.gl.enableVertexAttribArray(this.aPosition);
                const buffer = this.gl.createBuffer();

                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
                this.gl.bufferData(this.gl.ARRAY_BUFFER, this.bufferData, this.gl.DYNAMIC_DRAW);

                this.gl.vertexAttribPointer(this.aPosition, 2, this.gl.FLOAT, false, 2 * 4, 0);

            }
        }


        return this;
    }

    onMouseMove(e: React.MouseEvent) {
        if (this.gl) {
            // this.gl.uniform1f(this.uPointSize, 200);
            this.gl.uniform2f(this.uMousePos, e.clientX, e.clientY);
        }
    }

    onClick() {
        if (this.gl) {
            console.log(this.bufferData.length / 2)
        }
    }

    draw() {
        this.gl = this.gl!
        this.gl.clear(this.gl.COLOR_BUFFER_BIT)
        this.gl.drawArrays(this.gl.POINTS, 0, this.bufferData.length / 2);

        requestAnimationFrame(this.draw.bind(this))
    }
}
