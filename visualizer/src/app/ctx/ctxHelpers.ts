type Color = {
    r: number,
    g: number,
    b: number,
    a?: number
}

const vectorNormalize = (v: number[]) => {
    const mag = Math.sqrt(v[0] * v[0] + v[1] * v[1])
    return [v[0] / mag, v[1] / mag]
}

const vectorSubstract = (a: number[], b: number[], sign?: boolean) => {
    if (sign) {
        return [a[0] - Math.sign(a[0]) * b[0], a[1] - Math.sign(a[1]) * b[1]]
    }

    return [a[0] - b[0], a[1] - b[1]]
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
    state = 0;

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
    }

    runFrom(x: number, y: number) {
        this.velocity[0] = this.x - x
        this.velocity[1] = this.y - y

        this.velocity = vectorNormalize(this.velocity)

        this.state = 1;
    }

    move() {
        if (this.state == 0) return;
        this.velocityProceed();
        // if (this.velocity[0] == 0 && this.velocity[1] == 0) {
        //     if (this.state == 1) {
        //         this.state = 2
        //         this.velocityToStart()
        //     } else if (this.state == 2) {
        //         this.x = this.startX
        //         this.y = this.startY
        //         this.state = 0;
        //     }
        // }
        this.x += this.velocity[0]
        this.y += this.velocity[1]


    }

    velocityProceed() {
        if (Math.abs(this.velocity[0]) < 0.1 && Math.abs(this.velocity[1]) < 0.1) {
            this.velocity = [0, 0]
            return;
        }
        this.velocity = vectorSubstract(this.velocity, [0.1, 0.1], true)
    }

    velocityToStart() {
        this.velocity = vectorNormalize([this.startX - this.x, this.startY - this.y])
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
        // points.forEach(point => {
        // const gridCoords = this.coordsToGridCoords(point.x, point.y)
        // this.grid[this.gridCoordsToIndex(gridCoords.x, gridCoords.y)].push(point);
        // })
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

    drawGrid() {
        let iG = this.points.length
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height)
        this.ctx.beginPath()
        this.forEach((point) => {
            point.move();
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
