type Color = {
    r: number,
    g: number,
    b: number,
    a?: number
}

const vectorNormalize = (v: number[]) => {
    const mag = Math.sqrt(v[0] * v[0] + v[1] * v[1])
    if (mag === 0) return [0, 0]
    return [v[0] / mag, v[1] / mag]
}

const vectorSubstract = (a: number[], b: number[], sign?: boolean) => {
    if (sign) {
        return [a[0] - Math.sign(a[0]) * b[0], a[1] - Math.sign(a[1]) * b[1]]
    }

    return [a[0] - b[0], a[1] - b[1]]
}

const vectorZeroCheck = (v: number[]) => {
    return v[0] == 0 && v[1] == 0
}

const vectorDistance = (a: number[], b: number[]) => {
    return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2)
}

const vectorScale = (v: number[], s: number) => {
    return [v[0] * s, v[1] * s]
}

type AnimatorCallback = (deltaTime: number) => void;

export class Animator {
    lastTime = performance.now();
    currentTime = performance.now();

    callbacks: Set<AnimatorCallback> = new Set();

    rendering = false;

    backbuffer: CanvasRenderingContext2D | null = null;
    frontbuffer: CanvasRenderingContext2D | null = null;

    add(callback: AnimatorCallback) {
        this.callbacks.add(callback)
        console.log("added")
        return this;
    }

    setBuffers(backbuffer: CanvasRenderingContext2D, frontbuffer: CanvasRenderingContext2D) {
        this.backbuffer = backbuffer
        this.frontbuffer = frontbuffer

        return this;
    }

    render() {
        const deltaTime = this.deltaTime();
        this.callbacks.forEach((callback) => {
            callback(deltaTime);
        })
        if (this.backbuffer && this.frontbuffer) {
            this.frontbuffer.clearRect(0, 0, this.backbuffer.canvas.width, this.backbuffer.canvas.height)
            this.frontbuffer.drawImage(this.frontbuffer.canvas, 0, 0)
        }
        console.log(1 / deltaTime)
        requestAnimationFrame(this.render.bind(this));
    }

    startRendering() {
        if (!this.rendering) {
            this.rendering = true;
            this.render()
        }
    }

    deltaTime() {
        this.currentTime = performance.now();
        const delta = (this.currentTime - this.lastTime) / 1000;
        this.lastTime = this.currentTime;
        return delta
    }

    clear() {
        this.callbacks.clear();
    }
}


enum PointState {
    STAY,
    AWAY,
    COMEBACK
}

export class ctxPoint {
    x: number
    y: number
    startX: number
    startY: number
    size: number
    color: Color = getInitialColor();
    ctx: CanvasRenderingContext2D
    velocity = [0, 0]
    startVelocity = [0, 0]
    state = PointState.STAY;

    speed = 0.1
    constructor(x: number, y: number, size: number, ctx: CanvasRenderingContext2D) {
        this.x = x
        this.y = y
        this.startX = x;
        this.startY = y;
        this.size = size;
        this.ctx = ctx;
    }

    draw() {
        this.ctx.fillStyle = `rgba(${this.color.r},${this.color.g},${this.color.b},${this.color.a}%)`
        this.ctx.fillRect(this.x, this.y, this.size, this.size)
        // this.ctx.fillRect(this.x, this.y, this.size, this.size)
    }

    runFrom(x: number, y: number) {
        this.velocity[0] = this.x - x
        this.velocity[1] = this.y - y

        this.velocity = vectorScale((this.velocity), 2);

        this.startVelocity = this.velocity;

        this.state = PointState.AWAY;
        this.speed = 0.01
    }

    move(deltaTime: number) {
        if (this.state == PointState.STAY) return;

        if (this.state == PointState.AWAY && vectorZeroCheck(this.velocity)) {
            // this.state = PointState.COMEBACK;
            // this.velocityToStart();
        } else if (this.state === PointState.COMEBACK && vectorDistance([this.x, this.y], [this.startX, this.startY]) < 100) {
            this.state = PointState.STAY;
            this.x = this.startX;
            this.y = this.startY;
            this.velocity = [0, 0];
            this.startVelocity = [0, 0];
        }

        this.velocityProceed();

        this.x += this.velocity[0] * deltaTime;
        this.y += this.velocity[1] * deltaTime


    }

    velocityProceed() {
        if (Math.abs(this.velocity[0]) == 0 && Math.abs(this.velocity[1]) == 0) {
            this.velocity = [0, 0]
            return;
        }

        if (this.state === PointState.COMEBACK) {
            this.velocityToStart();
        } else {
            this.velocity = vectorSubstract(
                this.velocity,
                [Math.abs(this.startVelocity[0]) * this.speed, Math.abs(this.startVelocity[1]) * this.speed],
                true
            )
        }

    }

    velocityToStart(scale: number = 1) {
        this.velocity = vectorScale(vectorNormalize([this.startX - this.x, this.startY - this.y]), scale);
    }


}

export class ctxGrid {
    mousePos: {
        current: {
            x: number, y: number
        } | null
    }
    points: ctxPoint[][] = [];
    ctx: CanvasRenderingContext2D
    width: number
    height: number
    size: number
    gridSize: number


    constructor(ctx: CanvasRenderingContext2D, width: number, height: number, size: number, mousePos: { current: { x: number, y: number } | null }) {
        this.ctx = ctx
        this.width = width
        this.height = height
        this.size = size
        this.gridSize = Math.ceil(width / size);
        this.mousePos = mousePos

        return this;
    }

    fillGrid(size: number) {
        for (let y = 0; y < this.height / size; y++) {
            for (let x = 0; x < this.width / size; x++) {
                const gridCoords = this.coordsToGridCoords(x * size, y * size)
                const index = this.gridCoordsToIndex(gridCoords.x, gridCoords.y)
                if (!this.points[index])
                    this.points[index] = []
                const cell = this.points[index]
                const point = new ctxPoint(x * size, y * size, size, this.ctx)
                cell.push(point)
            }
        }

        return this;
    }


    coordsToGridCoords(x: number, y: number) {
        return {
            x: Math.floor(x / this.size),
            y: Math.floor(y / this.size)
        }
    }

    gridCoordsToIndex(x: number, y: number) {
        return x + y * this.gridSize
    }

    indexToGridCoords(index: number) {
        return {
            x: index % this.gridSize,
            y: Math.floor(index / this.gridSize)
        }
    }

    coordsToIndex(x: number, y: number) {
        const gridCoords = this.coordsToGridCoords(x, y)
        return this.gridCoordsToIndex(gridCoords.x, gridCoords.y);
    }

    forEach(callback: (point: ctxPoint) => void) {
        let iG = this.points.length
        while (iG--) {
            const cell = this.points[iG]
            let iP = cell.length
            while (iP--) {
                const point = cell[iP]
                callback(point)
            }
        }
    }

    drawGrid(deltaTime: number) {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height)
        this.ctx.beginPath()
        this.forEach((point) => {
            point.move(deltaTime);
            point.draw();
        })
        this.ctx.closePath();

        // this.ctx.fill();

        return this;
    }
}

const getInitialColor = () => {
    return {
        r: 0,
        g: 0,
        b: 255,
        a: 30
    }
}
