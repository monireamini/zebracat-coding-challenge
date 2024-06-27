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
            {text: 'World', position: '170,200', startFrame: 60, endFrame: 90},
            {text: 'Always Visible', position: '200,400'},
        ]
    });

    const handleExportVideo = async () => {
        // ... (export logic remains the same)
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
                    <h1 className="text-lg text-white mr-4">Add New |</h1>

                    <div className="flex flex-col items-center">
                        <button
                            onClick={handleExportVideo}
                            disabled={isExporting}
                            className="text-white px-4 hover:bg-blue-500 rounded-xl"
                        >
                            Text
                        </button>
                    </div>

                    <div className="flex flex-col items-center">
                        <button
                            onClick={handleExportVideo}
                            disabled={isExporting}
                            className="text-white px-4 hover:bg-blue-500 rounded-xl"
                        >
                            Emoji
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

            <h2 className="text-xl font-bold mb-4 text-white self-start">Video Preview and Text Editor</h2>

            {/* Video player and overlay editor container */}
            <div className="relative w-full" style={{aspectRatio: '16/9'}}>
                {/* Video player */}
                <div className="absolute inset-0">
                    <Player
                        component={VideoWithOverlays}
                        durationInFrames={30 * 30}
                        compositionWidth={1280}
                        compositionHeight={720}
                        fps={30}
                        clickToPlay={false}
                        controls
                        inputProps={inputProps}
                    />
                </div>

                {/* Text overlay editor */}
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
                    />
                </div>
            </div>
        </main>
    )
}
