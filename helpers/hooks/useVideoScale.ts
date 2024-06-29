import { useState, useEffect, RefObject } from 'react';

interface Size {
    width: number;
    height: number;
}

interface Scale {
    x: number;
    y: number;
}

export function useVideoScale(
    compositionSize: Size,
    containerRef: RefObject<HTMLDivElement>
): Scale {
    const [scale, setScale] = useState<Scale>({ x: 1, y: 1 });

    useEffect(() => {
        const updateScale = () => {
            if (containerRef.current) {
                const containerWidth = containerRef.current.clientWidth;
                const containerHeight = containerRef.current.clientHeight;
                setScale({
                    x: containerWidth / compositionSize.width,
                    y: containerHeight / compositionSize.height,
                });
            }
        };

        updateScale();
        window.addEventListener('resize', updateScale);
        return () => window.removeEventListener('resize', updateScale);
    }, [compositionSize, containerRef]);

    return scale;
}
