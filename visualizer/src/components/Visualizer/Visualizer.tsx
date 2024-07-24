'use client'

import { useEffect, useRef, useState } from "react";
import { createPoints, drawPoints, Grid, Point } from "./helpers";
import useMeasure from 'react-use-measure'

import "./Visualizer.sass"



const Visualizer = () => {

    const [gridPoints, setGridPoints] = useState<Grid | null>(null);
    const [ref, { width, height }] = useMeasure();

    const canvas = useRef<HTMLCanvasElement | null>(null);
    const ctx = useRef<CanvasRenderingContext2D | null>(null);

    useEffect(() => {
        ctx.current = canvas.current?.getContext('2d') || null;

        return () => {
            ctx.current = null;
        }
    }, [canvas])

    useEffect(() => {
        const width = canvas.current?.clientWidth || 0;
        const height = canvas.current?.clientHeight || 0;

        setGridPoints(() => {
            const grid = new Grid(width, height, 100)
            grid.fillGrid(createPoints(width, height, 10));
            grid.startDrawing(ctx.current!);
            return grid
        });


        return () => {
            setGridPoints(null);
        }


    }, [ctx.current])

    // useEffect(() => {
    // if (!gridPoints) return
    // ctx.current?.clearRect(0, 0, width, height);
    // gridPoints.drawGrid(ctx.current!);
    // gridPoints.drawGridBorders(ctx.current!);
    // }, [gridPoints])


    return (
        <canvas id="canvas" ref={(element) => {
            ref(element);
            canvas.current = element;
        }} width={width} height={height} onMouseMove={(e) => {
            if (!gridPoints) return

            gridPoints.collisionCircle(e.clientX, e.clientY, 10, (points) => {
                points.forEach(point => {
                    point.color = {
                        r: 255,
                        g: 0,
                        b: 0
                    }
                })
            })
        }}>

        </canvas>
    );
}

export default Visualizer
