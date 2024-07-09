export type Color = {
    r: number;
    g: number;
    b: number;
}

export class Point {
    x: number;
    y: number;
    size: number;
    color: Color;
    constructor(x: number, y: number, w: number, color: Color) {
        this.x = x;
        this.y = y;
        this.size = w;
        this.color = color;
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
            drawPoints(cell, ctx)
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

    collision(x: number, y: number, callback: (points: Point[]) => void) {
        const gridCoords = this.coordsToGridCoords(x, y)
        callback(this.grid[this.gridCoordsToIndex(gridCoords.x, gridCoords.y)])
    }
}

const getRandomColor = () => {
    return {
        r: Math.floor(Math.random() * 255),
        g: Math.floor(Math.random() * 255),
        b: Math.floor(Math.random() * 255),
    }
}

const createPoints = (width: number, height: number, size: number) => {
    const points: Point[] = [];
    for (let y = 0; y < height / size; y++) {
        for (let x = 0; x < width / size; x++) {
            points.push(new Point(x * size, y * size, size, getRandomColor()))
        }
    }
    return points
}

const drawPoints = (points: Point[], ctx: CanvasRenderingContext2D) => {
    for (const point of points) {
        ctx.fillStyle = `rgb(${point.color.r}, ${point.color.g}, ${point.color.b})`;
        ctx.fillRect(point.x, point.y, point.size, point.size);
    }
}

export {
    createPoints,
    drawPoints
}
