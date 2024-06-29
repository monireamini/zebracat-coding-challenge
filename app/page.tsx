'use client'

import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Player, PlayerRef} from '@remotion/player';
import {VideoWithOverlays} from '../remotion/Root';
import TextOverlayEditor from '../components/TextOverlayEditor';

const aspectRatios: string[] = ['16:9', '4:3', '1:1', '3:4', '9:16'];

export default function Home() {
    const [isExporting, setIsExporting] = useState(false);
    const [inputProps, setInputProps] = useState({
        videoData: '',
        videoPosition: '0,0',
        textOverlays: []
    });
    const [isUploading, setIsUploading] = useState(false);
    const [compositionSize, setCompositionSize] = useState({width: 1280, height: 720});
    const [videoSize, setVideoSize] = useState({width: 1280, height: 720});
    const [videoAspectRatio, setVideoAspectRatio] = useState('16:9');
    const [selectedAspectRatio, setSelectedAspectRatio] = useState<string>('16:9');

    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [dragStart, setDragStart] = useState({x: 0, y: 0});
    const videoContainerRef = useRef(null);

    const [scale, setScale] = useState({x: 1, y: 1});
    const containerRef = useRef<HTMLDivElement>(null);

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

    const handleAspectRatioChange = (newRatio: string) => {
        setSelectedAspectRatio(newRatio);

        // Calculate new dimensions based on the selected aspect ratio
        const [width, height] = newRatio.split(':').map(Number);

        // The H264 codec does only support dimensions that are evenly divisible by two.
        setCompositionSize(prev => {
            const newHeight = Math.floor(prev.width * height / width);
            return {
                width: prev.width % 2 === 0 ? prev.width : prev.width - 1,
                height: newHeight % 2 === 0 ? newHeight : newHeight - 1
            };
        });
    };

    const handleExportVideo = async () => {
        setIsExporting(true);

        try {
            const response = await fetch('/api/export-video', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({...inputProps, compositionSize, videoSize}),
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = 'exported_video.mp4';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                const text = await response.text();
                throw new Error(text || 'Failed to export video');
            }
        } catch (error) {
            console.log('error: ', error)
        } finally {
            setIsExporting(false);
        }
    };

    const handleSetOverlays = (newOverlays) => {
        setInputProps(prev => ({
            ...prev,
            textOverlays: newOverlays
        }));
    }

    const addNewTextOverlay = () => {
        playerRef?.current?.pause()
        setPreviewMode(false)

        const newOverlay = {
            id: Date.now(),
            text: 'New Text',
            position: '50,50',
        };
        setInputProps(prev => ({
            ...prev,
            textOverlays: [...prev.textOverlays, newOverlay]
        }));
    };

    const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        setSelectedFile(file?.name)
        if (file) {
            setIsUploading(true);

            const formData = new FormData();
            formData.append('video', file);

            try {
                const response = await fetch('/api/upload-video', {
                    method: 'POST',
                    body: formData,
                });

                if (response.ok) {
                    const data = await response.json();
                    setInputProps(prev => ({
                        ...prev,
                        videoData: data.videoUrl
                    }));

                    // Create a video element to get the dimensions
                    const video = document.createElement('video');
                    video.src = data.videoUrl;
                    video.onloadedmetadata = () => {
                        const width = video.videoWidth;
                        const height = video.videoHeight;
                        const currentAspectRatio = calculateAspectRatio(width, height)
                        setVideoSize({width, height});
                        setCompositionSize({width, height})
                        setVideoAspectRatio(currentAspectRatio);
                        setSelectedAspectRatio(currentAspectRatio);
                    };
                } else {
                    throw new Error('Failed to upload video');
                }
            } catch (error) {
                console.log('error: ', error)
            } finally {
                setIsUploading(false);
            }
        }
    };

    function calculateAspectRatio(width: number, height: number): string {
        const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
        const divisor = gcd(width, height);
        return `${width / divisor}:${height / divisor}`;
    }

    const playerRef = useRef<PlayerRef>(null);

    const [isPlaying, setIsPlaying] = useState(false);

    const updatePlayingStatus = useCallback(() => {
        if (playerRef.current) {
            setIsPlaying(playerRef.current.isPlaying());
        }
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            updatePlayingStatus();
        }, 100); // Check every 100ms

        return () => clearInterval(interval);
    }, [updatePlayingStatus]);

    const [selectedFile, setSelectedFile] = useState("No file chosen");
    const [previewMode, setPreviewMode] = useState(false)

    return (
        <main className="flex min-h-screen flex-col items-center justify-start p-6 max-w-full overflow-x-hidden">
            <div className="flex flex-row w-full justify-between items-start mb-4">
                <h1 className="text-2xl font-semibold text-blue-500">Video Editing Environment</h1>
                <div>
                    <button
                        onClick={() => setPreviewMode((prev) => {
                            if (!prev) playerRef?.current?.play?.()
                            else playerRef?.current?.pause?.()
                            return !prev
                        })}
                        disabled={isExporting || !inputProps.videoData}
                        className="mr-4 bg-blue-500 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                    >
                        {previewMode ? 'Switch to Edit Mode' : 'Switch to Preview Mode'}
                    </button>
                    <button
                        onClick={handleExportVideo}
                        disabled={isExporting || !inputProps.videoData}
                        className="bg-blue-500 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                    >
                        {isExporting ? 'Exporting...' : 'Export Video'}
                    </button>
                </div>
            </div>

            <p className="self-start mb-3 text-lg">Select a video to enhance with dynamic text overlays!</p>

            <div className="flex flex-row w-full justify-between items-center mb-4">
                <div className="flex flex-row justify-start items-center">
                    <input
                        id="video-upload"
                        type="file"
                        accept="video/*"
                        onChange={handleVideoUpload}
                        disabled={isUploading}
                        className="hidden w-full text-sm text-foreground
                    file:mr-4 file:py-2 file:px-4 file:rounded-md
                    file:border-0 file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-pink-100"
                    />
                    <label
                        htmlFor="video-upload"
                        className="block mr-4 py-2 px-4
                    rounded-md border-0 bg-blue-50
                    text-blue-700 hover:bg-blue-100 cursor-pointer"
                    >
                        Select a video
                    </label>
                    <label className="text-sm text-slate-400">{selectedFile}</label>
                </div>


                {inputProps.videoData && (
                    <div>
                        <button
                            onClick={addNewTextOverlay}
                            disabled={!inputProps.videoData}
                            className="mr-4 bg-blue-500 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                        >
                            Add Text
                        </button>

                        <select
                            value={selectedAspectRatio}
                            onChange={(e) => handleAspectRatioChange(e.target.value as string)}
                            className="bg-blue-500 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                        >
                            {(aspectRatios.includes(videoAspectRatio) ? aspectRatios : [videoAspectRatio, ...aspectRatios]).map((ratio) => (
                                <option key={ratio} value={ratio}>
                                    {ratio}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

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
                        durationInFrames={30 * 30}
                        compositionWidth={compositionSize.width}
                        compositionHeight={compositionSize.height}
                        fps={30}
                        clickToPlay={false}
                        inputProps={{
                            ...inputProps,
                            videoSize,
                            compositionSize,
                            textOverlays: isPlaying && previewMode ? inputProps.textOverlays : []
                        }}
                        style={{
                            width: '100%',
                            height: '100%',
                        }}
                        controls={previewMode}
                    />

                    {/* Video container */}
                    {!isPlaying && !previewMode && (
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
                            {/* Resize handle */}
                            <div
                                className="absolute bg-emerald-400 cursor-nesw-resize border-white border-2 rounded-full h-[12px] w-[12px] top-0 right-0"
                                onMouseDown={handleResizeStart}
                            />
                        </div>
                    )}

                    {/* Text overlay editor */}
                    {!isPlaying && !previewMode && (
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
                    onClick={() => document.getElementById('video-upload').click()}
                >
                    + upload a video to start editing
                </div>
            )}
        </main>
    )
}