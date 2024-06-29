import React from "react";
import {useDraggable} from "@dnd-kit/core";
import {DraggableOverlayProps} from "../../types/definitions";

/**
 * DraggableOverlay Component
 *
 * Renders a draggable and editable text overlay for video compositions.
 *
 * Features:
 * - Draggable text element
 * - Double-click to edit text content
 * - Switches between text display and input mode
 * - Updates overlay position on drag
 * - Scales position and font size based on composition scale
 */
export const DraggableOverlay: React.FC<DraggableOverlayProps> = ({overlay, isEditing, onTextChange, onStartEditing, onStopEditing, scale}) => {
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

    const x = parseInt(overlay.position.split(',')[0])
    const y = parseInt(overlay.position.split(',')[1])

    return (
        <div
            className="pointer-events-auto"
            style={{
                position: 'absolute',
                left: x * scale.x,
                top: y * scale.y,
            }}
        >
            {isEditing ? (
                <input
                    type="text"
                    value={overlay.text}
                    onChange={handleInputChange}
                    onBlur={onStopEditing}
                    className={`border-2 border-green-500 rounded-[8px] px-2 py-1 outline-none text-white bg-textBackground font-bold text-[${24 * scale.x}px]`}
                    onClick={(e) => e.stopPropagation()}
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
