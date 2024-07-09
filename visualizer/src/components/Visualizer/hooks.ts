import { useState } from "react";

const useMeasure = () => {

    const [size, setSize] = useState({ width: 0, height: 0 });

    return {
        ...size,
        watch: (element: HTMLElement | null) => {
            if (!element) return
            setSize(() => ({
                width: element.clientWidth,
                height: element.clientHeight
            }))
        }
    }
}

