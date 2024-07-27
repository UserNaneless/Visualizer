'use client'

import { useEffect, useMemo, useRef, useState } from "react";
import { Grid, PointAction } from "./helpers";
import useMeasure from 'react-use-measure'
import { throttle } from "lodash"

import "./Visualizer.sass"
import { Application } from "pixi.js";

const pointSize = 10;
const cellSize = 200;
const fps = 144;

const app = new Application();
// window.app = app;

// app.init();

const Visualizer = () => {

    const [gridPoints, setGridPoints] = useState<Grid | null>(null);
    const [ref, { width, height }] = useMeasure();

    const canvas = useRef<HTMLCanvasElement | null>(null);
    const ctx = useRef<CanvasRenderingContext2D | null>(null);
    const [loaded, setLoaded] = useState(false);
    const mousePosRef = useRef({
        x: 0,
        y: 0
    })

    const radius = useRef(60);

    useEffect(() => {
        if (canvas.current) {

            app.init({
                canvas: canvas.current,
                width,
                height
            }).then(() => {
                app.ticker.maxFPS = 144
                setLoaded(true);
                app.renderer.background.color = 0xffffff
            }).catch((err) => {
            });

        }

        return () => {
            ctx.current = null;
        }
    }, [canvas])

    useEffect(() => {
        if (!loaded) return
        setGridPoints(() => {
            const grid = new Grid(width, height, cellSize).fillGrid(width, height, pointSize).startDrawing(app.stage)

            const runFrom = () => {
                const { x, y } = mousePosRef.current;
                grid.collisionCircle(x, y, radius.current, (point) => {
                    // gridPoints.collisionAll(e.clientX, e.clientY, radius.current, (points) => {
                    point.runFrom(x, y)
                })
            }

            app.ticker.add(({ deltaTime }) => {
                runFrom();
                grid.movePoints(deltaTime);
            })

            return grid;
        });

    }, [loaded])


    const throttledMove = useMemo(() => throttle((e) => {
        if (!gridPoints) return
        gridPoints.collisionCircle(e.clientX, e.clientY, radius.current, (point) => {
            // gridPoints.collisionAll(e.clientX, e.clientY, radius.current, (points) => {
            point.runFrom(e.clientX, e.clientY)
        })
    }, 1000 / fps), [gridPoints])


    return (
        <div className="wrapper" ref={ref}>
            <canvas id="canvas" ref={(element) => {
                canvas.current = element;
            }} width={width} height={height}

                onClick={() => console.log(gridPoints)}

                onTouchMove={e => {
                    if (!gridPoints) return
                    gridPoints.collisionCircle(e.touches[0].clientX, e.touches[0].clientY, radius.current, (point) => {
                        point.color = {
                            r: 255,
                            g: 0,
                            b: 0,
                            a: 50
                        }
                        point.runFrom(e.touches[0].clientX, e.touches[0].clientY)
                    })
                }}

                onMouseMove={(e) => {
                    // throttledMove(e)
                    mousePosRef.current = {
                        x: e.clientX,
                        y: e.clientY
                    }
                }}
                onWheel={(e) => {
                    radius.current += e.deltaY / 120
                }}
            >
            </canvas>
        </div>
    );
}

export default Visualizer
