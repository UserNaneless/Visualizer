'use client'

import { useEffect, useRef, useState } from "react";
import "./CtxVisualizer.sass"

type Color = {
    r: number;
    g: number;
    b: number;
    a: number;
}

const GRID_X = 10;
const GRID_Y = 10;

type Grid = Particle[][];

class Particle {
    x: number;
    y: number;
    vx: number = 0;
    vy: number = 0;
    startX: number;
    startY: number;
    size: number;
    color: Color = {
        r: 0,
        g: 0,
        b: 124,
        a: .3
    };
    state: number = 0;
    constructor(x: number, y: number, size: number) {
        this.x = x;
        this.y = y;
        this.startX = x;
        this.startY = y;
        this.size = size;

        return this;
    }

    setColor(color: Color) {
        this.color = color;
    }

    draw(ctx: CanvasRenderingContext2D) {

        this.move();

        ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.color.a})`;
        ctx.fillRect(this.x, this.y, this.size, this.size);

    }

    trigger(x: number, y: number) {
        this.state = 1;
        this.vx = (this.x - x) / 10;
        this.vy = (this.y - y) / 10;
    }

    move() {
        switch(this.state) {
            case 1: {
                if(Math.abs(this.vx) < .1 && Math.abs(this.vy) < .1) {
                    this.state = 2;
                    this.vx = (this.startX - this.x) / 10;
                    this.vy = (this.startY - this.y) / 10;
                }
                this.x += this.vx;
                this.y += this.vy;
                this.vx *= .95
                this.vy *= .95
                break;
            }
            case 2: {
                if(Math.abs(this.x + this.vx - this.startX) < .1 && Math.abs(this.y + this.vy - this.startY) < .1) {
                    this.state = 0;
                    this.vx = 0;
                    this.vy = 0;
                    this.x = this.startX;
                    this.y = this.startY;
                }
                this.x += this.vx;
                this.y += this.vy;
                this.vx = (this.startX - this.x) / 10;
                this.vy = (this.startY - this.y) / 10;
                break;
            }
        }
    }

}

const drawParticles = (particles: Particle[], ctx: CanvasRenderingContext2D) => {
    for (let i = 0; i < particles.length; i++) {
        particles[i].draw(ctx);
    }
}

const createParticles = (w: number, h: number, size: number) => {

    const particles: Particle[] = []

    for (let x = 0; x < w; x += size) {
        for (let y = 0; y < h; y += size) {
            particles.push(new Particle(x, y, size))
        }
    }

    return particles;

}

const createGrid = (w: number, h: number, size: number) => {
    const grid: Grid = [];
    for (let gx = 0; gx < w; gx += GRID_X * size) {
        for (let gy = 0; gy < h; gy += GRID_Y * size) {
            grid.push([])

            for (let x = 0; x < GRID_X; x++) {
                for (let y = 0; y < GRID_Y; y++) {
                    if (gx + x * size >= w || gy + y * size >= h) continue
                    grid[grid.length - 1].push(new Particle(gx + x * size, gy + y * size, size))
                }
            }

        }
    }

    return grid;
}

const drawGrid = (grid: Grid, ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    for (let i = 0; i < grid.length; i++) {
        drawParticles(grid[i], ctx);
    }
}

const traverseGrid = (grid: Grid, func: (particle: Particle) => void) => {
    for (let i = 0; i < grid.length; i++) {
        for (let j = 0; j < grid[i].length; j++) {
            func(grid[i][j]);
        }
    }
}

const CtxVisualizer = () => {

    const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

    const [size, setSize] = useState({
        width: 0,
        height: 0
    })

    const grid = useRef<Grid>([]);

    useEffect(() => {
        let frame: number;

        const render = () => {
            frame = requestAnimationFrame(render);
            ctxRef.current && drawGrid(grid.current, ctxRef.current);
        }

        setSize({
            width: window.innerWidth,
            height: window.innerHeight
        })

        render();

        return () => {
            cancelAnimationFrame(frame);
        }
    }, [])

    return (
        <div className="wrapper">
            <canvas width={size.width} height={size.height} ref={item => {
                if (item) {
                    ctxRef.current = item.getContext("2d");
                    grid.current = createGrid(item.width, item.height, 10);

                    window.grid = grid.current;
                }
            }}

                onMouseMove={e => {
                    if (ctxRef.current) {
                        traverseGrid(grid.current, particle => {
                            const x = particle.x - e.clientX;
                            const y = particle.y - e.clientY;
                            const r = 50;
                            if (x * x + y * y < r * r)
                                particle.trigger(e.clientX, e.clientY);
                        })
                    }
                }}

            ></canvas>
        </div>
    )
}

export default CtxVisualizer;
