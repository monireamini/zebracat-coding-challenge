'use client'

import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Player, PlayerRef} from '@remotion/player';
import {VideoWithOverlays} from "../remotion/VideoWithOverlays";
import {TextOverlayEditor} from "../components/TextOverlayEditor/TextOverlayEditor";
import {initialInputProps} from "../types/constants";
import {VideoWithOverlaysProps} from "../types/definitions";
import {useVideoScale} from "../helpers/hooks/useVideoScale";
import {Toolbar} from "../components/Toolbar/Toolbar";

export default function Home() {
    const [inputProps, setInputProps] = useState(initialInputProps);

    // Dimensions of the final output video (in pixels)
    const [compositionSize, setCompositionSize] = useState<VideoWithOverlaysProps["compositionSize"]>({
        width: 1280,
        height: 720
    });

    // Duration of the originally uploaded video (in seconds)
    const [videoDuration, setVideoDuration] = useState(10); // default 10 seconds

    // Dimensions of the originally uploaded video (in pixels)
    const [videoSize, setVideoSize] = useState<VideoWithOverlaysProps["videoSize"]>({width: 1280, height: 720});

    // Indicates whether the video is currently being dragged within the composition
    const [isDragging, setIsDragging] = useState<boolean>(false);

    // Indicates whether the video is currently being resized within the composition
    const [isResizing, setIsResizing] = useState<boolean>(false);

    // Starting coordinates for drag operations, used to calculate position changes
    const [dragStart, setDragStart] = useState<{ x: number, y: number }>({x: 0, y: 0});

    // Reference to the video container element for drag and resize operations
    // Note: Video dimensions may differ from overall composition dimensions
    const videoContainerRef = useRef(null);

    // Scale factor for displaying video in browser relative to original size
    // x: (current composition width in browser) / (original uploaded video width)
    // y: (current composition height in browser) / (original uploaded video height)
    const containerRef = useRef<HTMLDivElement>(null);
    const scale = useVideoScale(compositionSize, containerRef);

    const handleMouseDown = (e) => {
        if (e.target === videoContainerRef.current) {
            setIsDragging(true);
            const [x, y] = inputProps.videoPosition.split(',').map(Number);
            setDragStart({
                x: e.clientX - x,
                y: e.clientY - y
            });
        }
    };

    const handleMouseMove = useCallback((e) => {
        if (isDragging) {
            const newX = e.clientX - dragStart.x;
            const newY = e.clientY - dragStart.y;
            setInputProps(prev => ({
                ...prev,
                videoPosition: `${newX},${newY}`
            }));
        } else if (isResizing) {
            const newWidth = Math.max(e.clientX - dragStart.x, 20); // Minimum width of 20px
            const newHeight = Math.max((e.clientX - dragStart.x) * (videoSize.height / videoSize.width), 20); // Minimum height of 20px
            setVideoSize({width: newWidth, height: newHeight});
        }
    }, [isDragging, isResizing, dragStart]);

    const handleMouseUp = () => {
        setIsDragging(false);
        setIsResizing(false);
    };

    const handleResizeStart = (e) => {
        e.stopPropagation();
        setIsResizing(true);
        const [x, y] = inputProps.videoPosition.split(',').map(Number);
        setDragStart({x: e.clientX - videoSize.width, y: e.clientY - videoSize.height});
    };

    useEffect(() => {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleMouseMove]);

    const handleSetOverlays = (newOverlays) => {
        setInputProps(prev => ({
            ...prev,
            textOverlays: newOverlays
        }));
    }

    const playerRef = useRef<PlayerRef>(null);

    // Controls the current mode of the video editor
    // true: Preview mode - allows playing, pausing, seeking, and viewing animations
    // false: Edit mode - enables adding text overlays, dragging, and resizing video within composition
    const [previewMode, setPreviewMode] = useState(false);

    return (
        <main className="flex min-h-screen flex-col items-center justify-start p-6 max-w-full overflow-x-hidden">
            <Toolbar
                previewMode={previewMode}
                setPreviewMode={setPreviewMode}
                playerRef={playerRef}
                compositionSize={compositionSize}
                setCompositionSize={setCompositionSize}
                videoSize={videoSize}
                inputProps={inputProps}
                setInputProps={setInputProps}
                setVideoSize={setVideoSize}
                setVideoDuration={setVideoDuration}
            />

            {inputProps.videoData ? (
                <div
                    ref={containerRef}
                    className="relative w-full border-2 border-green-500 rounded-[8px] overflow-hidden"
                    style={{aspectRatio: `${compositionSize.width} / ${compositionSize.height}`}}
                >
                    {/* Player component */}
                    <Player
                        ref={playerRef}
                        component={VideoWithOverlays}
                        durationInFrames={30 * videoDuration}
                        compositionWidth={compositionSize.width}
                        compositionHeight={compositionSize.height}
                        fps={30}
                        clickToPlay={false}
                        inputProps={{
                            ...inputProps,
                            videoSize,
                            compositionSize,
                            textOverlays: previewMode ? inputProps.textOverlays : []
                        }}
                        style={{
                            width: '100%',
                            height: '100%',
                        }}
                        controls={previewMode}
                    />

                    {/* Virtual video container for drag and resize operations */}
                    {!previewMode && (
                        <div
                            ref={videoContainerRef}
                            className="absolute"
                            style={{
                                width: `${videoSize.width * scale.x}px`,
                                height: `${videoSize.height * scale.y}px`,
                                left: parseInt(inputProps.videoPosition.split(',')[0]) * scale.x + 'px',
                                top: parseInt(inputProps.videoPosition.split(',')[1]) * scale.y + 'px',
                                cursor: isDragging ? 'grabbing' : 'move',
                            }}
                            onMouseDown={handleMouseDown}
                        >
                            {/* Resize handle in top-right corner */}
                            <div
                                className="absolute bg-emerald-400 cursor-nesw-resize border-white border-2 rounded-full h-[12px] w-[12px] top-0 right-0"
                                onMouseDown={handleResizeStart}
                            />
                        </div>
                    )}

                    {/* Text overlay editor */}
                    {!previewMode && (
                        <div className="absolute inset-0" style={{pointerEvents: 'none'}}>
                            <TextOverlayEditor
                                overlays={inputProps.textOverlays}
                                setOverlays={handleSetOverlays}
                                compositionSize={compositionSize}
                                scale={scale}
                            />
                        </div>
                    )}
                </div>
            ) : (
                <div
                    className="w-full p-16 mt-4 flex items-center justify-center border-2 border-mediumGray rounded-2xl text-xl text-mediumGray"
                    onClick={() => document.getElementById('video-upload')?.click?.()}
                >
                    + upload a video to start editing
                </div>
            )}
        </main>
    )
}