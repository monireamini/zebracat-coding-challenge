import React from 'react';
import {
    Composition,
    Sequence,
    useVideoConfig,
    Video,
    useCurrentFrame,
    spring,
    interpolate,
} from 'remotion';
import { loadFont } from '@remotion/google-fonts/Roboto';

const { fontFamily } = loadFont();

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

const TextOverlay: React.FC<TextOverlayProps> = ({ text, position }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const [x, y] = position.split(',').map(Number);

    const words = text.split(' ');
    const loopDuration = 60

    return (
        <div
            style={{
                position: 'absolute',
                left: x,
                top: y,
                fontFamily,
                fontSize: '24px',
                fontWeight: 'bold',
                color: 'white',
                textShadow: '0 0 5px black',
                display: 'flex',
                flexWrap: 'wrap',
            }}
        >
            {words.map((word, i) => {
                const delay = i * 5;
                const loopFrame = frame % loopDuration;
                const animatedOpacity = spring({
                    fps,
                    frame: loopFrame - delay,
                    config: {
                        damping: 200,
                    },
                    durationInFrames: loopDuration - 10, // Leave some frames for reset
                });

                const animatedY = interpolate(animatedOpacity, [0, 1], [20, 0]);

                return (
                    <span
                        key={i}
                        style={{
                            opacity: animatedOpacity,
                            transform: `translateY(${animatedY}px)`,
                            marginRight: '0.3em',
                        }}
                    >
                        {word}
                    </span>
                );
            })}
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