export class WebGL {
    gl: WebGL2RenderingContext | null = null
    prog: WebGLProgram | null = null


    vertexShader = `#version 300 es
    
    uniform float uPointSize;
    uniform vec2 uMousePos;
    uniform vec2 uResolution;

    out float dist;

    out float output1;
    out float output2;

    layout(location = 0) in vec2 aPosition;

    layout(location = 1) in float input1;
    layout(location = 2) in float input2;

    vec2 toScreen(vec2 pos) {
        vec2 newPos = (pos / uResolution) * 2.0 - 1.0;
        return vec2(newPos.x, -newPos.y);
    }

    void main() {
        output1 = input1 + 1.0;
        output2 = input2 + 2.0;
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

    count = 0

    report = false;

    bufferData: Float32Array = new Float32Array([

    ]);

    buffers = new Map<string, WebGLBuffer>();
    transformBuffers = new Map<string, WebGLBuffer>();
    attributes = new Map<string, number>();

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
        for (let y = 0; y <= window.innerHeight; y += 5) {
            for (let x = 0; x <= window.innerWidth; x += 5) {
                p.push(x, y)
            }
        }

        this.bufferData = new Float32Array(p);
        this.count = this.bufferData.length / 2
        return this;
    }

    createBufferSize(name: string, size: number, type: number = this.gl!.STATIC_DRAW) {
        this.gl = this.gl!
        const buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, size, type);
        this.buffers.set(name, buffer!)
        return this;
    }

    createBufferSource(name: string, source: Float32Array, type: number = this.gl!.STATIC_DRAW) {
        this.gl = this.gl!
        const buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, source, type);
        this.buffers.set(name, buffer!)
        return this;
    }

    createTransformBufferSize(name: string, size: number, type: number = this.gl!.DYNAMIC_DRAW) {
        this.gl = this.gl!
        const buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, size, type);
        this.transformBuffers.set(name, buffer!)
        return this;
    }

    createAttribute(location: number, name: string, size: number, chunkSize: number, offset: number) {
        if (location in this.attributes) {
            throw new Error("Attribute already exists");
        }

        this.gl = this.gl!
        this.gl.vertexAttribPointer(location, size, this.gl.FLOAT, false, chunkSize, offset);
        this.gl.enableVertexAttribArray(location);
        this.attributes.set(name, location);
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


                this.gl.transformFeedbackVaryings(prog, ["output1", "output2"], this.gl.INTERLEAVED_ATTRIBS);


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
                this.gl.uniform1f(this.uPointSize, 5);

                this.uResolution = this.gl.getUniformLocation(this.prog, 'uResolution');
                this.gl.uniform2f(this.uResolution, window.innerWidth, window.innerHeight);;

                this.uMousePos = this.gl.getUniformLocation(this.prog, 'uMousePos');

                //BUFFERS
                this.createBufferSource("positionBuffer", this.bufferData, this.gl.DYNAMIC_DRAW);

                this.createTransformBufferSize("buffer1", this.count * 4 * 2, this.gl.DYNAMIC_READ);
                // this.createTransformBufferSize("buffer2", this.count * 4, this.gl.DYNAMIC_READ);

                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.get("positionBuffer")!);

                //ATTRIBUTEs
                this.createAttribute(0, "aPosition", 2, 2 * 4, 0);

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

        this.gl.bindBufferBase(this.gl.TRANSFORM_FEEDBACK_BUFFER, 0, this.transformBuffers.get("buffer1")!);
        // this.gl.bindBufferBase(this.gl.TRANSFORM_FEEDBACK_BUFFER, 1, this.transformBuffers.get("buffer2")!);

        this.gl.beginTransformFeedback(this.gl.POINTS);
        this.gl.drawArrays(this.gl.POINTS, 0, this.bufferData.length / 2);
        this.gl.endTransformFeedback();


        this.gl.bindBufferBase(this.gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);
        // this.gl.bindBufferBase(this.gl.TRANSFORM_FEEDBACK_BUFFER, 1, null);

        // if(!this.report) {
            this.readBufferData("buffer1", this.count) ;
            // this.report = true;
        // }

        requestAnimationFrame(this.draw.bind(this))
    }


    readBufferData(name: string, size: number, type: number = this.gl!.TRANSFORM_FEEDBACK_BUFFER) {
        this.gl = this.gl!
        const buffer = this.transformBuffers.get(name)
        if(!buffer) throw new Error(`Buffer ${name} not found`)
        const data = new Float32Array(size);
        this.gl.bindBuffer(type, buffer);
        this.gl.getBufferSubData(type, 0, data);
        console.log(data)
    }
}
