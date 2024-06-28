'use client'

import React, {useCallback, useState} from 'react';
import {Player} from '@remotion/player';
import {VideoWithOverlays} from '../remotion/Root';
import TextOverlayEditor from '../components/TextOverlayEditor';

export default function Home() {
    const [isExporting, setIsExporting] = useState(false);
    const [exportMessage, setExportMessage] = useState('');
    const [inputProps, setInputProps] = useState({
        videoData: '/BigBuckBunny.mp4',
        textOverlays: [
            {text: 'Hello', position: '100,200', startFrame: 0, endFrame: 90},
            {text: 'World', position: '170,200', startFrame: 0, endFrame: 90},
            {text: 'Always Visible', position: '200,400'},
        ]
    });
    const [isUploading, setIsUploading] = useState(false);
    const [uploadMessage, setUploadMessage] = useState('');

    const [videoSize, setVideoSize] = useState({width: 1280, height: 720});

    const handleExportVideo = async () => {
        setIsExporting(true);
        setExportMessage('Exporting video...');

        try {
            console.log('Sending export request...');
            const response = await fetch('/api/export-video', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(inputProps),
            });

            console.log('Response received:', response.status, response.statusText);

            if (response.ok) {
                console.log('Response is OK, getting blob...');
                const blob = await response.blob();
                console.log('Blob received, size:', blob.size);

                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                // @todo: generate a random name for video file
                a.download = 'exported_video.mp4';
                document.body.appendChild(a);
                console.log('Download link created, clicking...');
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                setExportMessage('Video exported successfully! Check your downloads.');
            } else {
                console.log('Response not OK, getting error details...');
                const text = await response.text();
                console.log('Error details:', text);
                throw new Error(text || 'Failed to export video');
            }
        } catch (error) {
            console.error('Error in export process:', error);
            setExportMessage(`Error: ${error.message}`);
        } finally {
            setIsExporting(false);
        }
    };

    const handleOverlaysChange = useCallback((newOverlays) => {
        setInputProps(prev => ({
            ...prev,
            textOverlays: newOverlays.map(overlay => ({
                ...overlay,
                position: `${Math.round(overlay.position.x)},${Math.round(overlay.position.y)}`,
            }))
        }));
    }, []);

    const addNewTextOverlay = () => {
        const newOverlay = {
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
                        setVideoSize({width: video.videoWidth, height: video.videoHeight});
                    };
                } else {
                    throw new Error('Failed to upload video');
                }
            } catch (error) {
                console.error('Error uploading video:', error);
                setUploadMessage(`Error: ${error.message}`);
            } finally {
                setIsUploading(false);
            }
        }
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-start p-6">
            <div className="flex flex-row w-full justify-between items-center mb-4">
                <h1 className="text-2xl font-bold text-white">Video Generator</h1>

                <div className="flex flex-col items-center">
                    <button
                        onClick={handleExportVideo}
                        disabled={isExporting}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                    >
                        {isExporting ? 'Exporting...' : 'Export'}
                    </button>
                </div>
            </div>

            <div className="flex flex-row w-full justify-between items-center mb-4">
                <div className="flex flex-row w-full justify-start items-center mb-4">
                    <input
                        type="file"
                        accept="video/*"
                        onChange={handleVideoUpload}
                        disabled={isUploading}
                        className="text-white"
                    />
                    {/*{uploadMessage && (*/}
                    {/*    <p className="mt-2 text-sm text-gray-300">{uploadMessage}</p>*/}
                    {/*)}*/}

                    <h1 className="text-lg text-white mr-4">Add New |</h1>

                    <div className="flex flex-col items-center">
                        <button
                            onClick={addNewTextOverlay}
                            className="text-white px-4 hover:bg-blue-500 rounded-xl"
                        >
                            Text
                        </button>
                    </div>
                </div>

                <div className="flex flex-row w-full justify-start items-center mb-4">
                    <h1 className="text-lg text-white mr-4">Aspect Ratio | 16:9</h1>
                </div>
            </div>

            {/*{exportMessage && (*/}
            {/*    <p className="mt-4 text-sm text-gray-300 mb-4">{exportMessage}</p>*/}
            {/*)}*/}

            {/* Video player and overlay editor container */}
            <div className="relative w-full" style={{aspectRatio: '16/9'}}>
                {/* Video player */}
                <div className="absolute inset-0">
                    <div className="absolute inset-0">
                        <Player
                            component={VideoWithOverlays}
                            durationInFrames={30 * 30}
                            compositionWidth={videoSize.width}
                            compositionHeight={videoSize.height}
                            fps={30}
                            clickToPlay={false}
                            controls
                            inputProps={inputProps}
                        />
                    </div>
                </div>

                {/* Text overlay editor */}
                <div className="absolute inset-0">
                    <div className="absolute inset-0">
                        <TextOverlayEditor
                            initialOverlays={inputProps.textOverlays.map((overlay, index) => ({
                                id: `overlay-${index}`,
                                text: overlay.text,
                                position: {
                                    x: parseInt(overlay.position.split(',')[0]),
                                    y: parseInt(overlay.position.split(',')[1])
                                },
                                startFrame: overlay.startFrame,
                                endFrame: overlay.endFrame
                            }))}
                            onOverlaysChange={handleOverlaysChange}
                            videoSize={videoSize}
                        />
                    </div>
                </div>
            </div>
        </main>
    )
}
