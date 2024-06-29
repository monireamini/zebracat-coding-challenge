import React from 'react';
import {Composition} from 'remotion';
import {VideoWithOverlays} from "./VideoWithOverlays";
import {compositionDefaultProps} from "../types/constants";

export const RemotionRoot: React.FC = () => {
    return (
        <Composition
            id="VideoWithOverlays"
            component={VideoWithOverlays}
            durationInFrames={30 * 30}
            fps={30}
            width={1280}
            height={720}
            defaultProps={compositionDefaultProps}
        />
    );
};