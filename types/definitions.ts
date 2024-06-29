export interface TextOverlayProps {
    /**
     * Identifier
     */
    id: string

    /**
     * Text overlay content
     */
    text: string;

    /**
     * Text position in "x,y" format
     */
    position: string;
}

export interface VideoWithOverlaysProps {
    /**
     * Absolute path to the uploaded video file in the public directory
     */
    videoData: string;

    /**
     * Array of text overlays to be rendered on the video
     */
    textOverlays: TextOverlayProps[];

    /**
     * Dimensions of the uploaded video in pixels
     */
    videoSize: { width: number; height: number };

    /**
     * Video position in "x,y" format
     */
    videoPosition,

    /**
     * Dimensions of the desired output video in pixels
     */
    compositionSize: { width: number; height: number };
}