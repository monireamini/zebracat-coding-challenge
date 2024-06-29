import React from "react";
import {
    continueRender,
    delayRender,
    Sequence,
    staticFile,
    useVideoConfig,
    Video
} from "remotion";
import {VideoWithOverlaysProps} from "../types/definitions";
import {TextOverlay} from "./TextOverlay";
import {fontFamily} from "../types/constants";

// Load local font for offline use
const fontPath = staticFile('/Poppins-Regular.ttf');

const loadFont = () => {
    const font = new FontFace(fontFamily, `url(${fontPath})`);
    const loadFontPromise = font.load().then(() => {
        document.fonts.add(font);
    });
    const handle = delayRender();
    loadFontPromise.then(() => continueRender(handle));
};


/**
 * VideoWithOverlays is the main component for the final video composition.
 * It renders a video with custom dimensions and position within the composition area,
 * along with one or more text overlays.
 *
 * Features:
 * - Renders a video that may not necessarily fill the entire composition
 * - Supports multiple text overlays positioned anywhere in the composition
 * - Uses a custom local font for offline compatibility
 * - Allows for flexible sizing and positioning of both video and text elements
 */
export const VideoWithOverlays: React.FC<VideoWithOverlaysProps> = ({
                                                                        videoData,
                                                                        videoPosition,
                                                                        textOverlays = [],
                                                                        compositionSize,
                                                                        videoSize
                                                                    }) => {

    loadFont();

    const {durationInFrames} = useVideoConfig();
    const [videoX, videoY] = videoPosition.split(',').map(Number);

    return (
        <div
            style={{width: compositionSize?.width, height: compositionSize?.height}}
            className="bg-background relative flex"
        >
            {/* Load local font for offline use */}
            <style>
                {`
                    @font-face {
                        font-family: '${fontFamily}';
                        src: url(${fontPath}) format('truetype');
                        font-weight: normal;
                        font-style: normal;
                    }
                `}
            </style>

            {videoData && (
                <Video
                    src={videoData}
                    style={{
                        position: 'absolute',
                        left: videoX,
                        top: videoY,
                        width: videoSize?.width,
                        height: videoSize?.height,
                    }}
                />
            )}

            {textOverlays.map((overlay) => {
                return (
                    <Sequence
                        key={overlay.id}
                        durationInFrames={durationInFrames}
                    >
                        <TextOverlay text={overlay.text} position={overlay.position}/>
                    </Sequence>
                );
            })}
        </div>
    );
};