import {Dispatch, SetStateAction, RefObject} from 'react';
import {PlayerRef} from '@remotion/player';

export interface TextOverlayProps {
    /**
     * Identifier
     */
    id: number | string

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

export interface TextOverlayEditorProps {
    /**
     * Array of text overlays to be rendered on the video
     */
    overlays: TextOverlayProps[];

    /**
     * Updates the array of text overlays in the video composition
     */
    setOverlays: (overlays: TextOverlayProps[]) => void;

    /**
     * Dimensions of the desired output video in pixels
     */
    compositionSize: { width: number; height: number };

    /**
     * Scale factor for video display in browser relative to original size
     */
    scale: { x: number; y: number }
}

export interface DraggableOverlayProps {
    overlay: TextOverlayProps;
    isEditing: boolean;
    onTextChange: (newText: string) => void;
    onStartEditing: () => void;
    onStopEditing: () => void;
    scale: { x: number; y: number };
}

export interface ToolbarProps {
    /**
     * Indicates whether the editor is in preview mode
     */
    previewMode: boolean;

    /**
     * Function to set the preview mode
     */
    setPreviewMode: Dispatch<SetStateAction<boolean>>;

    /**
     * Reference to the player component
     */
    playerRef: RefObject<PlayerRef>;

    /**
     * Size of the composition (width and height)
     */
    compositionSize: { width: number; height: number };

    /**
     * Function to set the composition size
     */
    setCompositionSize: Dispatch<SetStateAction<{ width: number; height: number }>>;

    /**
     * Size of the video (width and height)
     */
    videoSize: { width: number; height: number };

    /**
     * Input properties for the video editor
     */
    inputProps: {
        videoData: string;
        videoPosition: string;
        textOverlays: TextOverlayProps[];
    };

    /**
     * Function to set the input properties
     */
    setInputProps: Dispatch<SetStateAction<{
        videoData: string;
        videoPosition: string;
        textOverlays: TextOverlayProps[];
    }>>;

    /**
     * Function to set the video size
     */
    setVideoSize: Dispatch<SetStateAction<{ width: number; height: number }>>;

    /**
     * Function to set the video duration in seconds
     */
    setVideoDuration: Dispatch<SetStateAction<number>>;
}
