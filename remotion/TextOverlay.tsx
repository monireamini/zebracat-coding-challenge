import React from "react";
import {TextOverlayProps} from "../types/definitions";
import {interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import {fontFamily} from "../types/constants";

/**
 * Renders an animated text overlay on a video.
 *
 * Features:
 * - Splits text into words for individual animation
 * - Applies a looping animation to each word
 * - Initial 1-second stable visibility before animation starts
 * - Uses spring animation for smooth transitions
 * - Applies text shadow for better visibility on various backgrounds
 *
 * Current limitations:
 * - All text overlays use identical animation
 * - Animation loop and timing are fixed
 *
 * Future improvements:
 * - Allow customizable animation types per overlay
 * - Implement start and end frames for each overlay
 * - Add options for font customization (size, color, etc.)
 */
export const TextOverlay: React.FC<TextOverlayProps> = ({text, position}) => {
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
