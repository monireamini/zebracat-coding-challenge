import React from 'react';
import {
    Composition,
    Sequence,
    useVideoConfig,
    Video,
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
            dangerouslySetInnerHTML={{ __html: text }}
        />
    );
};

export const VideoWithOverlays: React.FC<VideoWithOverlaysProps> = ({ videoData, textOverlays = [] }) => {
    const { durationInFrames, width, height } = useVideoConfig();

    return (
        <div style={{flex: 1, backgroundColor: 'black', position: 'relative', width, height}}>
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
                textOverlays: [
                    { text: 'Default Text', position: '100,100' }
                ]
            }}
        />
    );
};