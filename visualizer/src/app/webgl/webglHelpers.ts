type Attribute = {
    name: string,
    location: number,
    size: number,
    chunkSize: number,
    offset: number
}


export class WebGL {
    gl: WebGL2RenderingContext | null = null
    prog: WebGLProgram | null = null


    vertexShader = `#version 300 es
    
    uniform float uPointSize;
    uniform vec2 uMousePos;
    uniform vec2 uResolution;

    out float dist;

    out vec2 vPosition;
    out vec2 vVelocity;
    out vec2 vStartPosition;
    out float vState;

    layout(location = 0) in vec2 aPosition;
    layout(location = 1) in vec2 aVelocity;
    layout(location = 2) in vec2 aStartPosition;
    layout(location = 3) in float aState;

    vec2 toScreen(vec2 pos) {
        vec2 newPos = (pos / uResolution) * 2.0 - 1.0;
        return vec2(newPos.x, -newPos.y);
    }

    void main() {
        vVelocity = aVelocity;
        vStartPosition = aStartPosition;
        vState = aState;

        dist = distance(aPosition, uMousePos);
        if(dist < 100.0) {
            vVelocity = normalize(aPosition - uMousePos);
        }

        vec2 nextPosition = aPosition + vVelocity;
        
        float distToStart = distance(aPosition, aStartPosition);
        if(distToStart > 500.0) {
            vVelocity = vec2(0.0, 0.0);
            nextPosition = aStartPosition;
        }

        gl_Position = vec4(toScreen(aPosition + vVelocity), 0.0, 1.0);
        gl_PointSize = uPointSize;

        vPosition = nextPosition;
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

    defaultPointSize = 1;

    report = false;

    bufferData: Float32Array = new Float32Array([

    ]);

    buffers = new Map<string, WebGLBuffer>();
    transformBuffers = new Map<string, WebGLBuffer>();
    attributes = new Map<string, Attribute>();
    vaos = new Map<string, WebGLVertexArrayObject>();

    activeVao: WebGLVertexArrayObject | null = null;

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
        for (let y = 0; y <= window.innerHeight; y += this.defaultPointSize) {
            for (let x = 0; x <= window.innerWidth; x += this.defaultPointSize) {
                p.push(x, y, 0, 0, x, y, 0);
            }
        }

        this.bufferData = new Float32Array(p);
        this.count = this.bufferData.length / 7
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

    createTransformBufferSource(name: string, size: number, source: Float32Array, type: number = this.gl!.DYNAMIC_DRAW) {
        this.gl = this.gl!
        const buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, size, type);
        this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, source);
        this.transformBuffers.set(name, buffer!)
        return this;
    }

    createAttribute(location: number, name: string, size: number, chunkSize: number, offset: number) {
        this.gl = this.gl!
        this.gl.vertexAttribPointer(location, size, this.gl.FLOAT, false, chunkSize, offset);
        this.gl.enableVertexAttribArray(location);
        this.attributes.set(name, {
            name: name,
            location: location,
            size: size,
            chunkSize: chunkSize,
            offset: offset
        });
        return this;

    }

    activateAttribute(name: string) {
        this.gl = this.gl!
        const attr = this.attributes.get(name);
        if (!attr)
            throw new Error("Attribute not found: " + name);
        this.gl.vertexAttribPointer(attr.location, attr.size, this.gl.FLOAT, false, attr.chunkSize, attr.offset);
        this.gl.enableVertexAttribArray(attr.location);
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


                this.gl.transformFeedbackVaryings(prog, ["vPosition", "vVelocity", "vStartPosition", "vState"], this.gl.INTERLEAVED_ATTRIBS);


                this.gl.linkProgram(prog)
                if (!this.gl.getProgramParameter(prog, this.gl.LINK_STATUS)) {
                    console.log(this.gl.getShaderInfoLog(frag))
                    console.log(this.gl.getShaderInfoLog(vert))
                    console.log(this.gl.getProgramInfoLog(prog))
                }

                this.gl.useProgram(prog);
                this.prog = prog;
                this.gl.clearColor(1, 1, 1, 1)
                // this.gl.enable(this.gl.DEPTH_TEST)


                this.uPointSize = this.gl.getUniformLocation(this.prog, 'uPointSize');
                this.gl.uniform1f(this.uPointSize, this.defaultPointSize);

                this.uResolution = this.gl.getUniformLocation(this.prog, 'uResolution');
                this.gl.uniform2f(this.uResolution, window.innerWidth, window.innerHeight);;

                this.uMousePos = this.gl.getUniformLocation(this.prog, 'uMousePos');

                //BUFFERS
                this.createTransformBufferSource("buffer1", this.bufferData.length * 4, this.bufferData, this.gl.DYNAMIC_READ);
                this.createTransformBufferSize("buffer2", this.bufferData.length * 4, this.gl.DYNAMIC_READ);

                //ATTRIBUTEs
                this.createAttribute(0, "aPosition", 2, 4 * 7, 0); // x y vx vy sx sy s
                this.createAttribute(1, "aVelocity", 2, 4 * 7, 4 * 2);
                this.createAttribute(2, "aStartPosition", 2, 4 * 7, 4 * 4);
                this.createAttribute(3, "aState", 1, 4 * 7, 4 * 5);

                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);

                const vao1 = this.gl.createVertexArray();
                this.gl.bindVertexArray(vao1);
                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.transformBuffers.get("buffer1")!);
                this.activateAttribute("aPosition");
                this.activateAttribute("aVelocity");
                this.activateAttribute("aStartPosition");
                this.activateAttribute("aState");
                this.gl.bindVertexArray(null);
                this.vaos.set("vao1", vao1!);

                const vao2 = this.gl.createVertexArray();
                this.gl.bindVertexArray(vao2);
                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.transformBuffers.get("buffer2")!);
                this.activateAttribute("aPosition");
                this.activateAttribute("aVelocity");
                this.activateAttribute("aStartPosition");
                this.activateAttribute("aState");
                this.gl.bindVertexArray(null);
                this.vaos.set("vao2", vao2!);

                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);

            }
        }


        return this;
    }

    vaoSwitch() {
        this.gl = this.gl!;
        if (!this.activeVao)
            this.activeVao = this.vaos.get("vao1")!;

        this.gl.bindVertexArray(this.activeVao);
        if (this.activeVao === this.vaos.get("vao1")) {
            this.gl.bindBufferBase(this.gl.TRANSFORM_FEEDBACK_BUFFER, 0, this.transformBuffers.get("buffer2")!);
            this.activeVao = this.vaos.get("vao2")!
        }
        else {
            this.gl.bindBufferBase(this.gl.TRANSFORM_FEEDBACK_BUFFER, 0, this.transformBuffers.get("buffer1")!);
            this.activeVao = this.vaos.get("vao1")!
        }

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

        this.vaoSwitch();
        // this.gl.bindVertexArray(this.vaos.get("vao1")!);
        // this.gl.bindBufferBase(this.gl.TRANSFORM_FEEDBACK_BUFFER, 0, this.transformBuffers.get("buffer2")!);

        this.gl.beginTransformFeedback(this.gl.POINTS);
        this.gl.drawArrays(this.gl.POINTS, 0, this.count);
        this.gl.endTransformFeedback();

        this.gl.bindVertexArray(null);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
        this.gl.bindBufferBase(this.gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);
        // this.gl.bindBufferBase(this.gl.TRANSFORM_FEEDBACK_BUFFER, 1, null);

        // if (!this.report) {
        // this.readBufferData("buffer2", this.count * 7);
        // console.log(this.bufferData)
        // this.readBufferData("buffer2", this.count * 7);
        // this.report = true;
        // }

        requestAnimationFrame(this.draw.bind(this))
    }


    readBufferData(name: string, size: number, type: number = this.gl!.TRANSFORM_FEEDBACK_BUFFER) {
        this.gl = this.gl!
        const buffer = this.transformBuffers.get(name)
        if (!buffer) throw new Error(`Buffer ${name} not found`)
        const data = new Float32Array(size);
        this.gl.bindBuffer(type, buffer);
        this.gl.getBufferSubData(type, 0, data);
        console.log(data)
    }
}
