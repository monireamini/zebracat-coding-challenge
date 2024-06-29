import React, {useState} from 'react';
import {DndContext, DragEndEvent, useDroppable} from '@dnd-kit/core';
import {TextOverlayEditorProps} from "../../types/definitions";
import {DraggableOverlay} from "./DraggableTextOverlay";

/**
 * TextOverlayEditor Component
 *
 * Provides a transparent overlay for editing and dragging text overlays.
 * This virtual editor sits on top of the video composition, allowing for:
 * - Drag-and-drop positioning of text overlays
 * - Text editing functionality
 * - Syncing overlay data with the main state
 *
 * Note: In edit mode, actual composition overlays are hidden to prevent visual discrepancies
 * due to scaling differences between the editor and the final render.
 */
export const TextOverlayEditor: React.FC<TextOverlayEditorProps> = ({
                                                                        overlays,
                                                                        setOverlays,
                                                                        compositionSize,
                                                                        scale
                                                                    }) => {
    const [editingId, setEditingId] = useState<string | null>(null);

    const handleDragEnd = (event: DragEndEvent) => {
        const {active, delta} = event;
        setOverlays(overlays.map((overlay) => {
                const x = parseInt(overlay.position.split(',')[0])
                const y = parseInt(overlay.position.split(',')[1])

                /**
                 * Update text position based on original composition size, not scaled browser view
                 */
                return overlay.id === active.id
                    ? {
                        ...overlay,
                        position: `${Math.min(Math.max(0, x + delta.x / scale.x), compositionSize.width)},${Math.min(Math.max(0, y + delta.y / scale.y), compositionSize.height)}`
                    }
                    : overlay
            }
        ))
    };

    const handleTextChange = (id: string, newText: string) => {
        setOverlays(overlays.map((overlay) =>
            overlay.id === id ? {...overlay, text: newText} : overlay
        ));
    };

    const {setNodeRef} = useDroppable({id: 'editor-area'});

    return (
        <div className="w-full h-full pointer-events-none">
            <div ref={setNodeRef} className="pointer-events-auto">
                <DndContext onDragEnd={handleDragEnd}>
                    {overlays?.map((overlay) => (
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

