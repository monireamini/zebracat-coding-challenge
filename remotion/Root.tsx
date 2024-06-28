import React, {useState} from 'react';
import {
    Composition,
    Sequence,
    useVideoConfig,
    Video,
} from 'remotion';
import {Resizable} from "re-resizable";

interface TextOverlayProps {
    text: string;
    position: string;
}

interface Overlay extends TextOverlayProps {
    startFrame?: number;
    endFrame?: number;
}

interface VideoWithOverlaysProps {
    videoData: string;
    textOverlays: Overlay[];
    videoSize: { width: number; height: number };
}

const TextOverlay: React.FC<TextOverlayProps> = ({text, position}) => {
    const [x, y] = position.split(',').map(Number);

    return (
        <div
            style={{
                position: 'absolute',
                left: x,
                top: y,
                fontSize: '24px',
                fontWeight: 'bold',
                color: 'white',
                textShadow: '0 0 5px black',
            }}
        >
            {text}
        </div>
    );
};

export const VideoWithOverlays: React.FC<VideoWithOverlaysProps> = ({
                                                                        videoData,
                                                                        videoPosition,
                                                                        textOverlays = [],
                                                                        compositionSize,
                                                                        videoSize,
                                                                        onVideoResize
                                                                    }) => {
    const {durationInFrames} = useVideoConfig();
    const [videoX, videoY] = videoPosition.split(',').map(Number);

    const [currentVideoSize, setCurrentVideoSize] = useState(videoSize);

    const handleResize = (e, direction, ref, d) => {
        const newSize = {
            width: currentVideoSize.width + d.width,
            height: currentVideoSize.height + d.height
        };
        setCurrentVideoSize(newSize);
        onVideoResize?.(newSize);
    };

    return (
        <div style={{
            flex: 1,
            backgroundColor: 'black',
            position: 'relative',
            width: compositionSize?.width,
            height: compositionSize?.height
        }}>
            {videoData && (
                <Resizable
                    size={currentVideoSize}
                    onResizeStop={handleResize}
                    minWidth={100}
                    minHeight={100}
                    maxWidth={compositionSize.width * 2}
                    maxHeight={compositionSize.height * 2}
                    style={{
                        position: 'absolute',
                        left: videoX,
                        top: videoY,
                        width: currentVideoSize?.width,
                        height: currentVideoSize?.height,
                    }}
                >
                    <Video
                        src={videoData}
                        style={{
                            width: '100%',
                            height: '100%',
                        }}
                    />
                </Resizable>
            )}

            {textOverlays.map((overlay, index) => {
                const startFrame = overlay.startFrame ?? 0;
                const endFrame = overlay.endFrame ?? durationInFrames;
                const overlayDuration = endFrame - startFrame;

                return (
                    <Sequence
                        key={index}
                        from={startFrame}
                        durationInFrames={overlayDuration}
                    >
                        <TextOverlay text={overlay.text} position={overlay.position}/>
                    </Sequence>
                );
            })}
        </div>
    );
};

export const RemotionRoot: React.FC = () => {
    return (
        <Composition
            id="VideoWithOverlays"
            component={VideoWithOverlays}
            durationInFrames={30 * 30}
            fps={30}
            width={1280}
            height={720}
            defaultProps={{
                videoData: '/BigBuckBunny.mp4',
                videoPosition: '0,0',
                textOverlays: [
                    {text: 'Default Text', position: '100,100'}
                ],
                videoSize: {width: 1280, height: 720},
                compositionSize: {width: 1280, height: 720},
                onVideoResize: () => null,
            }}
        />
    );
};