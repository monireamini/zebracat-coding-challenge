import React from 'react';
import {
    Composition,
    getInputProps,
    Sequence,
    useVideoConfig,
    Video,
} from 'remotion';

// TextOverlay component to render each text overlay
const TextOverlay = ({text, position}) => {
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

// Main component
export const VideoWithOverlays = () => {
    const {videoData, textOverlays} = getInputProps();

    const {durationInFrames} = useVideoConfig();

    return (
        <div style={{flex: 1, backgroundColor: 'black', position: 'relative'}}>
            <Video src={videoData} />
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

// Remotion composition
export const RemotionRoot = () => {
    const {videoData, textOverlays} = getInputProps();

    return (
        <Composition
            id="VideoWithOverlays"
            component={VideoWithOverlays}
            durationInFrames={30 * 30} // Adjust this based on your video duration: 30 seconds
            fps={30}
            width={1280}
            height={720}
            defaultProps={{videoData, textOverlays}}
        />
    );
}