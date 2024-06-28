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
    videoSize: { width: number; height: number };
}

const TextOverlayEditor: React.FC<TextOverlayEditorProps> = ({initialOverlays, onOverlaysChange, videoSize}) => {
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
                    x: containerWidth / videoSize.width,
                    y: containerHeight / videoSize.height,
                });
            }
        };

        updateScale();
        window.addEventListener('resize', updateScale);
        return () => window.removeEventListener('resize', updateScale);
    }, [videoSize]);

    const handleDragEnd = (event: DragEndEvent) => {
        const {active, delta} = event;
        setOverlays((prevOverlays) =>
            prevOverlays.map((overlay) =>
                overlay.id === active.id
                    ? {
                        ...overlay,
                        position: {
                            x: Math.min(Math.max(0, overlay.position.x + delta.x / scale.x), videoSize.width),
                            y: Math.min(Math.max(0, overlay.position.y + delta.y / scale.y), videoSize.height),
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
        <div ref={containerRef} className="w-full h-full relative">
            <div
                ref={setNodeRef}
                className="absolute inset-0 pointer-events-auto"
                style={{
                    transform: `scale(${scale.x}, ${scale.y})`,
                    transformOrigin: 'top left',
                    width: videoSize.width,
                    height: videoSize.height
                }}
            >
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

const DraggableOverlay: React.FC<DraggableOverlayProps> = ({
                                                               overlay,
                                                               isEditing,
                                                               onTextChange,
                                                               onStartEditing,
                                                               onStopEditing,
                                                               scale,
                                                           }) => {
    const {attributes, listeners, setNodeRef, transform} = useDraggable({
        id: overlay.id,
    });

    const style = transform
        ? {
            transform: `translate3d(${transform.x / scale.x}px, ${transform.y / scale.y}px, 0)`,
        }
        : undefined;

    const handleDoubleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onStartEditing();
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onTextChange(e.target.value);
    };

    return (
        <div
            ref={setNodeRef}
            style={{
                ...style,
                position: 'absolute',
                left: overlay.position.x,
                top: overlay.position.y,
                cursor: isEditing ? 'text' : 'move',
                fontSize: `${24 / scale.x}px`,
                fontWeight: 'bold',
                color: '#FFFFFFAA',
                transform: `scale(${scale.x}, ${scale.y})`,
                transformOrigin: 'top left',
            }}
            {...attributes}
            {...listeners}
            onDoubleClick={handleDoubleClick}
        >
            {isEditing ? (
                <input
                    type="text"
                    value={overlay.text}
                    onChange={handleInputChange}
                    onBlur={onStopEditing}
                    autoFocus
                    className="bg-transparent border-none outline-none text-white font-bold"
                    onClick={(e) => e.stopPropagation()}
                />
            ) : (
                <span style={{
                    color: 'red'
                }}>
                    {overlay.text}
                </span>
            )}
        </div>
    );
};

export default TextOverlayEditor;
