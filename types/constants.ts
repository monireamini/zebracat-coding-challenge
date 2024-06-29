export const fontFamily = 'Poppins';

export const aspectRatios: string[] = ['16:9', '4:3', '1:1', '3:4', '9:16'];

export const initialInputProps = {
    videoData: '',
    videoPosition: '0,0',
    textOverlays: []
}

export const compositionDefaultProps = {
    videoData: '/BigBuckBunny.mp4',
    videoPosition: '0,0',
    textOverlays: [
        {text: 'Default Text', position: '100,100'}
    ],
    videoSize: {width: 1280, height: 720},
    compositionSize: {width: 1280, height: 720}
}
