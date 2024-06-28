import React, {useState, useEffect} from 'react';
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
}

const TextOverlayEditor: React.FC<TextOverlayEditorProps> = ({initialOverlays, onOverlaysChange}) => {
    const [overlays, setOverlays] = useState<TextOverlay[]>(initialOverlays);
    const [editingId, setEditingId] = useState<string | null>(null);

    useEffect(() => {
        setOverlays(initialOverlays);
    }, [initialOverlays]);

    useEffect(() => {
        onOverlaysChange(overlays);
    }, [overlays, onOverlaysChange]);

    const handleDragEnd = (event: DragEndEvent) => {
        const {active, delta} = event;
        setOverlays((prevOverlays) =>
            prevOverlays.map((overlay) =>
                overlay.id === active.id
                    ? {
                        ...overlay,
                        position: {
                            x: overlay.position.x + delta.x,
                            y: overlay.position.y + delta.y,
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
        <div ref={setNodeRef} className="pointer-events-auto w-[1280px] h-[720px]">
            <DndContext onDragEnd={handleDragEnd}>
                {overlays.map((overlay) => (
                    <DraggableOverlay
                        key={overlay.id}
                        overlay={overlay}
                        isEditing={editingId === overlay.id}
                        onTextChange={(newText) => handleTextChange(overlay.id, newText)}
                        onStartEditing={() => setEditingId(overlay.id)}
                        onStopEditing={() => setEditingId(null)}
                    />
                ))}
            </DndContext>
        </div>
    );
};

interface DraggableOverlayProps {
    overlay: TextOverlay;
    isEditing: boolean;
    onTextChange: (newText: string) => void;
    onStartEditing: () => void;
    onStopEditing: () => void;
}

const DraggableOverlay: React.FC<DraggableOverlayProps> = ({
                                                               overlay,
                                                               isEditing,
                                                               onTextChange,
                                                               onStartEditing,
                                                               onStopEditing,
                                                           }) => {
    const {attributes, listeners, setNodeRef, transform} = useDraggable({
        id: overlay.id,
    });

    const style = transform
        ? {
            transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
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
                fontSize: '24px',
                fontWeight: 'bold',
                color: 'white',
                textShadow: '0 0 5px black',
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
                    className="bg-transparent border-none outline-none text-white text-2xl font-bold"
                    style={{
                        textShadow: '0 0 5px black',
                    }}
                    onClick={(e) => e.stopPropagation()}
                />
            ) : (
                <span>{overlay.text}</span>
            )}
        </div>
    );
};

export default TextOverlayEditor;
