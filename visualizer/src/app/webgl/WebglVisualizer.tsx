'use client'

import useMeasure from "react-use-measure";
import "./WebglVisualizer.sass"
import { WebGL } from "./webglHelpers";

const webgl = new WebGL();

const WebglVisualizer = () => {

    const [ref, { width, height }] = useMeasure();

    return <div className="wrapper" ref={ref} onClick={() => {
        console.log(webgl)
        webgl.onClick();
    }} onMouseMove={e => webgl.onMouseMove(e)} onTouchMove={e => webgl.onTouchMove(e)}>
        <canvas ref={el => {
            if (el) {
                const gl = el.getContext('webgl2')
                if (gl)
                    webgl.setContext(gl).setup().draw();
            }
        }} width={width} height={height} />
    </div>
}

export default WebglVisualizer;
