import React from 'react';
import {Composition} from 'remotion';
import {VideoWithOverlays} from "./VideoWithOverlays";

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