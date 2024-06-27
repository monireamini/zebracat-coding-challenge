'use client'

import React, { useState } from 'react';
import { Player } from '@remotion/player';
import { VideoWithOverlays } from '../remotion/Root';

export default function Home() {
    const [isExporting, setIsExporting] = useState(false);
    const [exportMessage, setExportMessage] = useState('');
    const [exportLogs, setExportLogs] = useState('');
    const [inputProps, setInputProps] = useState({
        videoData: '/BigBuckBunny.mp4',
        textOverlays: [
            { text: 'Hello', position: '100,0', startFrame: 0, endFrame: 90 },
            { text: 'World', position: '170,0', startFrame: 60, endFrame: 90 },
            { text: 'Always Visible', position: '100,200' },
        ]
    });

    const handleExportVideo = async () => {
        setIsExporting(true);
        setExportMessage('Exporting video...');
        setExportLogs('');

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
                setExportLogs(`stdout: ${data.stdout}\n\nstderr: ${data.stderr}`);
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
                        {isExporting ? 'Exporting...' : 'Export Video'}
                    </button>
                    {/* @todo: use a snackbar for this */}
                    {/*{exportMessage && (*/}
                    {/*    <p className="mt-4 text-sm text-gray-600">{exportMessage}</p>*/}
                    {/*)}*/}
                    {/*{exportLogs && (*/}
                    {/*    <div className="w-full mt-4 p-4 bg-gray-100 rounded">*/}
                    {/*        <h3 className="font-bold">Export Logs:</h3>*/}
                    {/*        <pre className="whitespace-pre-wrap">{exportLogs}</pre>*/}
                    {/*    </div>*/}
                    {/*)}*/}
                </div>
            </div>

            {/* editor area for drag and drop texts*/}
            <div>
            </div>

            {/* result video */}
            <div className="w-full flex justify-center">
                <Player
                    component={VideoWithOverlays}
                    durationInFrames={30 * 30}
                    compositionWidth={1280}
                    compositionHeight={720}
                    fps={30}
                    controls
                    inputProps={inputProps}
                />
            </div>
        </main>
    )
}