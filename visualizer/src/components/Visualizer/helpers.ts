export type Color = {
    r: number;
    g: number;
    b: number;
    a?: number;
}

export type Rect = {
    x: number;
    y: number;
    w: number
}

export type Circle = {
    x: number;
    y: number;
    r: number
}

export type Velocity = {
    x: number;
    y: number
}

const circleRectCollision = (r: Rect, c: Circle) => {
    let [testX, testY] = [c.x, c.y];

    if (c.x < r.x) testX = r.x;
    else if (c.x > r.x + r.w) testX = r.x + r.w;

    if (c.y < r.y) testY = r.y;
    else if (c.y > r.y + r.w) testY = r.y + r.w;

    const distX = c.x - testX;
    const distY = c.y - testY;

    const distSquared = distX * distX + distY * distY;

    return distSquared <= c.r * c.r
}

enum PointAction {
    NotActive,
    Run,
    Return
}

export class Point {
    x: number;
    y: number;
    centerX: number;
    centerY: number
    startX: number;
    startY: number;
    size: number;
    color: Color;
    velocity: Velocity = {
        x: 0,
        y: 0
    }
    speed = 10
    maxSpeed = 10
    state = PointAction.NotActive
    constructor(x: number, y: number, w: number, color: Color) {
        this.x = x;
        this.startX = x;
        this.y = y;
        this.startY = y;
        this.size = w;
        this.color = color;
        this.centerX = x + w / 2;
        this.centerY = y + w / 2;
    }

    speedFrom(x: number, y: number) {
        if (this.state === PointAction.NotActive) {
            this.state = PointAction.Run

            this.velocity = {
                x: x - this.x,
                y: y - this.y
            }

            const magn = -Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y)

            this.velocity.x /= magn;
            this.velocity.y /= magn;
        }
    }

    move() {
        if (this.state !== PointAction.NotActive) {
            if (this.state === PointAction.Run) {
                this.x += this.velocity.x * this.speed;
                this.y += this.velocity.y * this.speed;
                this.speed -= 1

                if (this.speed < 0.1) {
                    this.speed = 0;
                    this.state = PointAction.Return;
                }
            }
            else if (this.state === PointAction.Return) {

                this.x -= this.velocity.x * this.speed;
                this.y -= this.velocity.y * this.speed;
                this.speed += .5;
                const distX = this.x - this.startX;
                const distY = this.y - this.startY;
                if (distX * distX + distY * distY < 25 || (isNaN(this.x) || isNaN(this.y))) {
                    this.reset();
                }
            }
        }
    }

    reset() {
        this.state = PointAction.NotActive
        this.x = this.startX;
        this.y = this.startY;
        this.speed = this.maxSpeed;
        this.velocity = {
            x: 0,
            y: 0
        }

    }
}

export class Grid {
    gridWidth: number;
    gridHeight: number;

    size: number;
    cells: number;
    grid: Point[][];
    constructor(width: number, height: number, size: number) {
        this.gridWidth = Math.ceil(width / size);
        this.gridHeight = Math.ceil(height / size);
        this.size = size;
        this.cells = this.gridWidth * this.gridHeight;
        this.grid = Array.from({
            length: this.cells
        }).map(() => []);
    }

    fillGrid(points: Point[]) {
        points.forEach(point => {
            const gridCoords = this.coordsToGridCoords(point.x, point.y)
            this.grid[this.gridCoordsToIndex(gridCoords.x, gridCoords.y)].push(point);
        })
    }

    startDrawing(ctx: CanvasRenderingContext2D) {
        const render = () => {
            this.drawGrid(ctx)
            this.drawGridBorders(ctx)
            requestAnimationFrame(render)
        }
        render();
    }

    drawGrid(ctx: CanvasRenderingContext2D) {
        ctx.clearRect(0, 0, this.gridWidth * this.size, this.gridHeight * this.size);
        this.grid.forEach((cell) => {
            drawAndMovePoints(cell, ctx)
        })
    }

    drawGridBorders(ctx: CanvasRenderingContext2D) {
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                ctx.strokeStyle = 'black';
                ctx.strokeRect(x * this.size, y * this.size, this.size, this.size);
            }
        }
    }

    coordsToGridCoords(x: number, y: number) {
        return {
            x: Math.floor(x / this.size),
            y: Math.floor(y / this.size)
        }
    }

    gridCoordsToIndex(x: number, y: number) {
        return x + y * this.gridWidth
    }

    indexToGridCoords(index: number) {
        return {
            x: index % this.gridWidth,
            y: Math.floor(index / this.gridWidth)
        }
    }

    collision(x: number, y: number, callback: (points: Point[]) => void) {
        const gridCoords = this.coordsToGridCoords(x, y)


        callback(this.grid[this.gridCoordsToIndex(gridCoords.x, gridCoords.y)])
    }

    collisionCircle(x: number, y: number, r: number, callback: (points: Point[]) => void) {
        const circle: Circle = {
            x,
            y,
            r
        }

        const points = this.grid.reduce((points, cell) => {
            const rect: Rect = {
                x: cell[0].x,
                y: cell[0].y,
                w: this.size
            }

            if (circleRectCollision(rect, circle)) {
                points.push(...cell)
            }
            return points
        }, [])

        callback(points.filter((point) => {
            const distX = circle.x - point.centerX;
            const distY = circle.y - point.centerY;
            const distSquared = distX * distX + distY * distY;
            return distSquared <= circle.r * circle.r
        }))
    }
}

const getRandomColor = () => {
    return {
        r: Math.floor(Math.random() * 255),
        g: Math.floor(Math.random() * 255),
        b: Math.floor(Math.random() * 255),
    }
}

const getWhiteColor = () => {
    return {
        r: 0,
        g: 0,
        b: 255,
        a: 25
    }
}

const createPoints = (width: number, height: number, size: number) => {
    const points: Point[] = [];
    for (let y = 0; y < height / size; y++) {
        for (let x = 0; x < width / size; x++) {
            points.push(new Point(x * size, y * size, size, getWhiteColor()))
        }
    }
    return points
}

const drawAndMovePoints = (points: Point[], ctx: CanvasRenderingContext2D) => {
    for (const point of points) {
        ctx.fillStyle = `rgba(${point.color.r}, ${point.color.g}, ${point.color.b}, ${point.color?.a || 100}%)`;
        ctx.fillRect(point.x, point.y, point.size, point.size);
        point.move();
    }
}

export {
    createPoints,
    drawAndMovePoints
}
