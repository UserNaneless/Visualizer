'use client'

import { useEffect, useMemo, useRef, useState } from "react";
import { Grid } from "./helpers";
import useMeasure from 'react-use-measure'
import { throttle } from "lodash"

import "./Visualizer.sass"
import { Application } from "pixi.js";

const pointSize = 10;

const app = new Application();
// window.app = app;

// app.init();

const Visualizer = () => {

    const [gridPoints, setGridPoints] = useState<Grid | null>(null);
    const [ref, { width, height }] = useMeasure();

    const canvas = useRef<HTMLCanvasElement | null>(null);
    const ctx = useRef<CanvasRenderingContext2D | null>(null);
    const [loaded, setLoaded] = useState(false);

    const radius = useRef(70);

    useEffect(() => {
        // ctx.current = canvas.current?.getContext('2d') || null;
        //

        if (canvas.current)
            app.init({
                canvas: canvas.current,
                width,
                height
            }).then(() => {
                setLoaded(true);
                app.renderer.background.color = 0xffffff
            }).catch((err) => {
            });


        return () => {
            ctx.current = null;
        }
    }, [canvas])

    useEffect(() => {
        if (!loaded) return
        setGridPoints(() => {
            const grid = new Grid(width, height, 100).fillGrid(width, height, pointSize).startDrawing(app.stage)

            app.ticker.add(() => {
                grid.movePoints();
            })

            return grid;
        });

    }, [loaded])

    // useEffect(() => {
    //     if (ctx.current) {
    //
    //         const width = canvas.current?.clientWidth || 0;
    //         const height = canvas.current?.clientHeight || 0;
    //
    //         setGridPoints(() => {
    //             const grid = new Grid(width, height, 100)
    //             grid.fillGrid(createPoints(width, height, pointSize));
    //             grid.startDrawing(ctx.current!);
    //             return grid
    //         });
    //
    //     }
    //
    //     return () => {
    //         setGridPoints(null);
    //     }
    //
    //
    // }, [ctx.current])

    // useEffect(() => {
    // if (!gridPoints) return
    // ctx.current?.clearRect(0, 0, width, height);
    // gridPoints.drawGrid(ctx.current!);
    // gridPoints.drawGridBorders(ctx.current!);
    // }, [gridPoints])
    //


    const throttledMove = useMemo(() => throttle((e) => {
        if (!gridPoints) return
        gridPoints.collisionCircle(e.clientX, e.clientY, radius.current, (points) => {
            // gridPoints.collisionAll(e.clientX, e.clientY, radius.current, (points) => {
            points.forEach(point => {
                point.speedFrom(e.clientX, e.clientY)
            })
        })
    }, 1000 / 144), [gridPoints])


    return (
        <div className="wrapper" ref={ref}>
            <canvas id="canvas" ref={(element) => {
                canvas.current = element;
            }} width={width} height={height}

                onClick={() => console.log(gridPoints)}

                onTouchMove={e => {
                    if (!gridPoints) return
                    gridPoints.collisionCircle(e.touches[0].clientX, e.touches[0].clientY, radius.current, (points) => {
                        points.forEach(point => {
                            point.color = {
                                r: 255,
                                g: 0,
                                b: 0,
                                a: 50
                            }
                            point.speedFrom(e.touches[0].clientX, e.touches[0].clientY)
                        })
                    })
                }}

                onMouseMove={(e) => {
                    throttledMove(e)
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
