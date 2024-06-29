'use client'

import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Player, PlayerRef} from '@remotion/player';
import {VideoWithOverlays} from '../remotion/Root';
import TextOverlayEditor from '../components/TextOverlayEditor';

const aspectRatios: string[] = ['16:9', '4:3', '1:1', '3:4', '9:16'];

export default function Home() {
    const [isExporting, setIsExporting] = useState(false);
    const [exportMessage, setExportMessage] = useState('');
    const [inputProps, setInputProps] = useState({
        videoData: '',
        videoPosition: '0,0',
        textOverlays: [
            {id: "1", text: 'Initial Text', position: '100,200'},
        ]
    });
    const [isUploading, setIsUploading] = useState(false);
    const [uploadMessage, setUploadMessage] = useState('');
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
        setExportMessage('Exporting video...');

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
                setExportMessage('Video exported successfully! Check your downloads.');
            } else {
                const text = await response.text();
                throw new Error(text || 'Failed to export video');
            }
        } catch (error) {
            setExportMessage(`Error: ${error.message}`);
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
        if (file) {
            setIsUploading(true);
            setUploadMessage('Uploading video...');

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
                    setUploadMessage('Video uploaded successfully!');

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
                setUploadMessage(`Error: ${error.message}`);
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

    const handleVideoSizeChange = (e: React.ChangeEvent<HTMLInputElement>, dimension: 'width' | 'height') => {
        const value = e.target.value;
        const numericValue = parseInt(value);
        const [aspectWidth, aspectHeight] = videoAspectRatio.split(':').map(Number);

        if (value === '') {
            // Allow clearing the input
            setVideoSize(prev => ({...prev, [dimension]: ''}));
        } else if (!isNaN(numericValue) && numericValue >= 0) {
            let newSize;
            if (dimension === 'width') {
                newSize = {
                    width: numericValue,
                    height: Math.round(numericValue * (aspectHeight / aspectWidth))
                };
            } else {
                newSize = {
                    width: Math.round(numericValue * (aspectWidth / aspectHeight)),
                    height: numericValue
                };
            }
            setVideoSize(newSize);
        }
    };

    const handleVideoPositionChange = (e: React.ChangeEvent<HTMLInputElement>, axis: 'x' | 'y') => {
        const value = e.target.value;
        const numericValue = parseInt(value);

        if (value === '' || !isNaN(numericValue)) {
            const [x, y] = inputProps.videoPosition.split(',').map(Number);
            const newPosition = axis === 'x' ? `${value},${y}` : `${x},${value}`;
            setInputProps(prev => ({...prev, videoPosition: newPosition}));
        }
    };


    return (
        <main className="flex min-h-screen flex-col items-center justify-start p-6 max-w-full overflow-x-hidden">
            <div className="flex flex-row w-full justify-between items-start mb-4">
                <h1 className="text-xl font-semibold">Video Editing Environment</h1>
                <button
                    onClick={handleExportVideo}
                    disabled={isExporting || !inputProps.videoData}
                    className="bg-blue-500 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                >
                    {isExporting ? 'Exporting...' : 'Export Video'}
                </button>
            </div>

            <p className="self-start mb-2 text-lg">Select a video to enhance with dynamic text overlays!</p>

            <div className="flex flex-row w-full justify-between items-center mb-4">
                <input
                    id="video-upload"
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    disabled={isUploading}
                />

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

            {inputProps.videoData && (
                <div className="mb-4 w-full flex flex-row justify-start items-center">
                    <div className="mr-2">
                        <label htmlFor="videoWidth" className="block text-sm">Width</label>
                        <input
                            id="videoWidth"
                            type="number"
                            value={videoSize.width}
                            onChange={(e) => handleVideoSizeChange(e, 'width')}
                            className="border-mediumGray border-2 rounded-xl font-bold py-2 px-4 disabled:opacity-50"
                        />
                    </div>
                    <div className="mr-4">
                        <label htmlFor="videoHeight" className="block text-sm">Height</label>
                        <input
                            id="videoHeight"
                            type="number"
                            value={videoSize.height}
                            onChange={(e) => handleVideoSizeChange(e, 'height')}
                            className="border-mediumGray border-2 rounded-xl font-bold py-2 px-4 disabled:opacity-50"
                        />
                    </div>
                    <div className="mr-2">
                        <label htmlFor="videoPositionX" className="block text-sm">Position X</label>
                        <input
                            id="videoPositionX"
                            type="number"
                            value={inputProps.videoPosition.split(',')[0]}
                            onChange={(e) => handleVideoPositionChange(e, 'x')}
                            className="border-mediumGray border-2 rounded-xl font-bold py-2 px-4 disabled:opacity-50"
                        />
                    </div>
                    <div>
                        <label htmlFor="videoPositionY" className="block text-sm">Position Y</label>
                        <input
                            id="videoPositionY"
                            type="number"
                            value={inputProps.videoPosition.split(',')[1]}
                            onChange={(e) => handleVideoPositionChange(e, 'y')}
                            className="border-mediumGray border-2 rounded-xl font-bold py-2 px-4 disabled:opacity-50"
                        />
                    </div>
                </div>
            )}

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
                            textOverlays: isPlaying ? inputProps.textOverlays : []
                        }}
                        style={{
                            width: '100%',
                            height: '100%',
                        }}
                        controls
                    />

                    {/* Video container */}
                    {!isPlaying && (
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
                                className="absolute bg-blue-400 cursor-nesw-resize border-white border-2 rounded-full h-[12px] w-[12px] top-0 right-0"
                                onMouseDown={handleResizeStart}
                            />
                        </div>
                    )}

                    {/* Text overlay editor */}
                    {!isPlaying && (
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