import React, {useState} from "react";
import {ToolbarProps} from "../../types/definitions";
import {aspectRatios} from "../../types/constants";
import {calculateAspectRatio} from "../../helpers/utils";

export const Toolbar: React.FC<ToolbarProps> = ({
                                                    previewMode,
                                                    setPreviewMode,
                                                    playerRef,
                                                    compositionSize,
                                                    setCompositionSize,
                                                    videoSize,
                                                    inputProps,
                                                    setInputProps,
                                                    setVideoSize,
                                                    setVideoDuration,
                                                }) => {

    const [isUploading, setIsUploading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    // Original aspect ratio of the uploaded video (e.g., '16:9', '4:3')
    const [videoAspectRatio, setVideoAspectRatio] = useState<string>('16:9');

    // User-selected aspect ratio for the final output video
    const [selectedAspectRatio, setSelectedAspectRatio] = useState<string>('16:9');

    // Display text for the file input, shows "No file chosen" initially or the selected file name
    const [selectedFile, setSelectedFile] = useState("No file chosen");

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
                        const duration = Math.ceil(Math.abs(video.duration));
                        const currentAspectRatio = calculateAspectRatio(width, height)
                        setVideoSize({width, height});
                        setCompositionSize({width, height})
                        setVideoAspectRatio(currentAspectRatio);
                        setSelectedAspectRatio(currentAspectRatio);
                        setVideoDuration(duration)
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

    const handleAspectRatioChange = (newRatio: string) => {
        // Update the selected aspect ratio state
        setSelectedAspectRatio(newRatio);

        // Extract width and height from the aspect ratio string (e.g., '16:9' -> [16, 9])
        const [width, height] = newRatio.split(':').map(Number);

        // Update composition size based on the new aspect ratio
        setCompositionSize(prev => {
            // Calculate new height while maintaining the current width
            const newHeight = Math.floor(prev.width * height / width);

            // Ensure dimensions are even for H264 codec compatibility
            return {
                // If width is odd, subtract 1 to make it even
                width: prev.width % 2 === 0 ? prev.width : prev.width - 1,
                // If calculated height is odd, subtract 1 to make it even
                height: newHeight % 2 === 0 ? newHeight : newHeight - 1
            };
        });
    }

    return (
        <>
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
                            className="appearance-none bg-blue-500 hover:bg-blue-800 text-white font-bold py-2 px-6 rounded disabled:opacity-50"
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
        </>
    )
}
