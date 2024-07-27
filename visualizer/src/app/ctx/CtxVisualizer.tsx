'use client'


import { useEffect, useRef, useState } from "react";
import "./CtxVisualizer.sass"
import useMeasure from "react-use-measure";
import { ctxGrid } from "./ctxHelpers";

const render = (grid: ctxGrid) => {
    requestAnimationFrame(() => render(grid))
    if (grid.mousePos.current) {
        const mousePos = grid.mousePos.current;
        grid.forEach((point) => {
            const dist = (point.x - mousePos.x) ** 2 + (point.y - mousePos.y) ** 2
            if (dist < 2500)
                point.runFrom(mousePos.x, mousePos.y)
        })
    }
    grid.drawGrid();
}

const pointSize = 10
const cellSize = pointSize * 20


const CtxVisualizer = () => {

    const [ref, { width, height }] = useMeasure();
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
    const grid = useRef<ctxGrid | null>(null);
    const mousePos = useRef<{
        x: number, y: number
    } | null>(null);

    const [dpr] = useState(1);


    useEffect(() => {
        if (ctxRef.current) {
            grid.current = new ctxGrid(ctxRef.current, width, height, cellSize, mousePos)
                .fillGrid(pointSize)

            render(grid.current);
        }
    }, [ctxRef.current])


    return <div className="wrapper" ref={ref} onClick={() => {
        console.log(grid.current)
    }} onMouseMove={(e) => {
        mousePos.current = { x: e.clientX, y: e.clientY }
    }} onTouchMove={e => {
        mousePos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }}>
        <canvas ref={el => {
            ctxRef.current = el?.getContext('2d') || null
        }} width={width * dpr} height={height * dpr} />
    </div>
}

export default CtxVisualizer;
