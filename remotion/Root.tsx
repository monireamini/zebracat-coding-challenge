import React from 'react';
import {
    Composition,
    continueRender,
    delayRender,
    interpolate,
    Sequence,
    spring,
    staticFile,
    useCurrentFrame,
    useVideoConfig,
    Video,
} from 'remotion';

const fontFamily = 'Poppins';
const fontPath = staticFile('/Poppins-Regular.ttf');

const loadFont = () => {
    const font = new FontFace(fontFamily, `url(${fontPath})`);
    const loadFontPromise = font.load().then(() => {
        document.fonts.add(font);
    });

    const handle = delayRender();
    loadFontPromise.then(() => continueRender(handle));
};

interface TextOverlayProps {
    text: string;
    position: string;
}

interface VideoWithOverlaysProps {
    videoData: string;
    textOverlays: TextOverlayProps[];
    videoSize: { width: number; height: number };
}

const TextOverlay: React.FC<TextOverlayProps> = ({text, position}) => {
    const frame = useCurrentFrame();
    const {fps} = useVideoConfig();
    const [x, y] = position.split(',').map(Number);

    const words = text.split(' ');
    const loopDuration = 60;
    const initialDelay = 30; // 1 second delay at 30 fps

    return (
        <div
            style={{
                position: 'absolute',
                left: x,
                top: y,
                fontFamily: `${fontFamily}, sans-serif`,
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
                const loopFrame = Math.max(0, frame - initialDelay) % loopDuration;
                const animatedOpacity = frame < initialDelay ? 1 : spring({
                    fps,
                    frame: loopFrame - delay,
                    config: {
                        damping: 200,
                    },
                    durationInFrames: loopDuration - 10, // Leave some frames for reset
                });

                const animatedY = frame < initialDelay ? 0 : interpolate(animatedOpacity, [0, 1], [20, 0]);

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

    loadFont();

    const {durationInFrames} = useVideoConfig();
    const [videoX, videoY] = videoPosition.split(',').map(Number);

    return (
        <div
            style={{width: compositionSize?.width, height: compositionSize?.height}}
            className="bg-background relative flex"
        >
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

            {textOverlays.map((overlay, index) => {
                return (
                    <Sequence
                        key={index}
                        durationInFrames={durationInFrames}
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