import React, {useState, useEffect, useRef} from 'react';
import {DndContext, DragEndEvent, useDraggable, useDroppable} from '@dnd-kit/core';

interface TextOverlay {
    id: string;
    text: string;
    position: { x: number; y: number };
    startFrame?: number;
    endFrame?: number;
}

interface TextOverlayEditorProps {
    initialOverlays: TextOverlay[];
    onOverlaysChange: (overlays: TextOverlay[]) => void;
    compositionSize: { width: number; height: number };
}

const TextOverlayEditor: React.FC<TextOverlayEditorProps> = ({initialOverlays, onOverlaysChange, compositionSize}) => {
    const [overlays, setOverlays] = useState<TextOverlay[]>(initialOverlays);
    const [editingId, setEditingId] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState({x: 1, y: 1});

    useEffect(() => {
        onOverlaysChange(overlays);
    }, [overlays, onOverlaysChange]);

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
    }, [compositionSize]);

    const handleDragEnd = (event: DragEndEvent) => {
        const {active, delta} = event;
        setOverlays((prevOverlays) =>
            prevOverlays.map((overlay) =>
                overlay.id === active.id
                    ? {
                        ...overlay,
                        position: {
                            x: Math.min(Math.max(0, overlay.position.x + delta.x / scale.x), compositionSize.width),
                            y: Math.min(Math.max(0, overlay.position.y + delta.y / scale.y), compositionSize.height),
                        },
                    }
                    : overlay
            )
        );
    };

    const handleTextChange = (id: string, newText: string) => {
        setOverlays((prevOverlays) =>
            prevOverlays.map((overlay) =>
                overlay.id === id ? {...overlay, text: newText} : overlay
            )
        );
    };

    const {setNodeRef} = useDroppable({
        id: 'editor-area',
    });

    return (
        <div ref={containerRef} className="w-full h-full pointer-events-none">
            <div ref={setNodeRef} className="pointer-events-auto">
                <DndContext onDragEnd={handleDragEnd}>
                    {overlays.map((overlay) => (
                        <DraggableOverlay
                            key={overlay.id}
                            overlay={overlay}
                            isEditing={editingId === overlay.id}
                            onTextChange={(newText) => handleTextChange(overlay.id, newText)}
                            onStartEditing={() => setEditingId(overlay.id)}
                            onStopEditing={() => setEditingId(null)}
                            scale={scale}
                        />
                    ))}
                </DndContext>
            </div>
        </div>
    );
};

interface DraggableOverlayProps {
    overlay: TextOverlay;
    isEditing: boolean;
    onTextChange: (newText: string) => void;
    onStartEditing: () => void;
    onStopEditing: () => void;
    scale: { x: number; y: number };
}

const DraggableOverlay = ({overlay, isEditing, onTextChange, onStartEditing, onStopEditing, scale}) => {
    const {attributes, listeners, setNodeRef, transform} = useDraggable({
        id: overlay.id,
    });

    const style = transform
        ? {
            transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        }
        : undefined;

    const handleDoubleClick = (e) => {
        e.stopPropagation();
        onStartEditing();
    };

    const handleInputChange = (e) => {
        onTextChange(e.target.value);
    };

    return (
        <div
            className="pointer-events-auto"
            style={{
                position: 'absolute',
                left: overlay.position.x * scale.x,
                top: overlay.position.y * scale.y,
            }}
        >
            {isEditing ? (
                <input
                    type="text"
                    value={overlay.text}
                    onChange={handleInputChange}
                    onBlur={onStopEditing}
                    className={`bg-transparent border-2 border-green-500 rounded-[4px] px-2 py-1 outline-none text-black text-[${24 * scale.x}px]`}
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                />
            ) : (
                <div
                    ref={setNodeRef}
                    style={{
                        ...style,
                        cursor: 'move',
                        fontSize: `${24 * scale.x}px`,
                        fontWeight: 'bold',
                        color: 'white',
                        textShadow: '0 0 5px black',
                    }}
                    {...attributes}
                    {...listeners}
                >
                    <span onDoubleClick={handleDoubleClick}>{overlay.text}</span>
                </div>
            )}
        </div>
    );
};

export default TextOverlayEditor;
