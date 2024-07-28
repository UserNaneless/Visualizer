'use client'


import { useEffect, useRef, useState } from "react";
import "./CtxVisualizer.sass"
import useMeasure from "react-use-measure";
import { Animator, ctxGrid } from "./ctxHelpers";

const animator = new Animator();
const gridRendering = (grid: ctxGrid, deltaTime: number) => {
    if (grid.mousePos.current) {
        const mousePos = grid.mousePos.current;
        let index = grid.coordsToIndex(mousePos.x, mousePos.y)
        const points = grid.points[index]
        index = points.length;
        while (index--) {
            const point = points[index];
            const dist = (point.x - mousePos.x) ** 2 + (point.y - mousePos.y) ** 2
            if (dist < 2500)
                point.runFrom(mousePos.x, mousePos.y)
        }
    }
    grid.drawGrid(deltaTime);
}

const pointSize = 10
const cellSize = pointSize * 20

let timer: NodeJS.Timeout;


const CtxVisualizer = () => {

    const [ref, { width, height }] = useMeasure();
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
    const backCtxRef = useRef<CanvasRenderingContext2D | null>(null);
    const grid = useRef<ctxGrid | null>(null);
    const mousePos = useRef<{
        x: number, y: number
    } | null>(null);

    const [dpr] = useState(1);


    useEffect(() => {
        if (ctxRef.current && backCtxRef.current && width != 0) {
            grid.current = new ctxGrid(backCtxRef.current, width, height, cellSize, mousePos)
                .fillGrid(pointSize)

            animator.setBuffers(backCtxRef.current, ctxRef.current).add((deltaTime: number) => gridRendering(grid.current!, deltaTime)).startRendering();
        }

        return () => {
            animator.clear()
        }
    }, [ctxRef.current, backCtxRef.current])


    return <div className="wrapper" ref={ref} onClick={() => {
        console.log(grid.current)
    }} onMouseMove={(e) => {
        mousePos.current = { x: e.clientX, y: e.clientY }
        clearTimeout(timer);
        timer = setTimeout(() => {
            mousePos.current = null
        }, 40)
    }} onTouchMove={e => {
        mousePos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }}>
        <canvas ref={el => {
            ctxRef.current = el?.getContext('2d') || null
        }} width={width * dpr} height={height * dpr} />

        <canvas className="backbuffer" ref={el => {
            backCtxRef.current = el?.getContext('2d') || null
        }} width={width * dpr} height={height * dpr} />

    </div>
}

export default CtxVisualizer;
