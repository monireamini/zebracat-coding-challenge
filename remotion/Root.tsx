import React from 'react';
import {
    Composition,
    Sequence,
    useVideoConfig,
    Video,
    useCurrentFrame,
    spring,
} from 'remotion';

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

const TextOverlay: React.FC<TextOverlayProps> = ({ text, position, animationDuration = 30 }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const [x, y] = position.split(',').map(Number);

    const characters = text.split('');
    const revealProgress = spring({
        frame,
        fps,
        config: {
            damping: 100,
            stiffness: 200,
            mass: 0.5,
        },
        durationInFrames: animationDuration,
    });

    const charactersToShow = Math.floor(characters.length * revealProgress);

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
            {characters.map((char, index) => (
                <span
                    key={index}
                    style={{
                        opacity: index < charactersToShow ? 1 : 0,
                        transition: 'opacity 0.1s ease-in-out',
                    }}
                >
                    {char}
                </span>
            ))}
        </div>
    );
};

export const VideoWithOverlays: React.FC<VideoWithOverlaysProps> = ({
                                                                        videoData,
                                                                        videoPosition,
                                                                        textOverlays = [],
                                                                        compositionSize,
                                                                        videoSize
                                                                    }) => {
    const {durationInFrames} = useVideoConfig();
    const [videoX, videoY] = videoPosition.split(',').map(Number);

    return (
        <div style={{
            flex: 1,
            backgroundColor: 'black',
            position: 'relative',
            width: compositionSize?.width,
            height: compositionSize?.height
        }}>
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
                compositionSize: {width: 1280, height: 720}
            }}
        />
    );
};