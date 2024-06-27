const { bundle } = require('@remotion/bundler');
const { getCompositions, renderMedia } = require('@remotion/renderer');
const ffprobe = require('ffprobe-static');
const { execFile } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs').promises;

const execFilePromise = promisify(execFile);

const getVideoDuration = async (videoPath) => {
    try {
        const { stdout } = await execFilePromise(ffprobe.path, [
            '-v',
            'error',
            '-show_entries',
            'format=duration',
            '-of',
            'default=noprint_wrappers=1:nokey=1',
            videoPath,
        ]);
        return parseFloat(stdout.trim());
    } catch (error) {
        console.error('Error getting video duration:', error);
        return null;
    }
};

const readVideoFile = async (videoPath) => {
    try {
        const data = await fs.readFile(videoPath);
        return `data:video/mp4;base64,${data.toString('base64')}`;
    } catch (error) {
        console.error('Error reading video file:', error);
        throw new Error('Failed to read video file');
    }
};

const start = async () => {
    // The composition you want to render
    const compositionId = 'VideoWithOverlays';

    // You can ignore this, as we will pass the input props directly to renderMedia
    const bundleLocation = await bundle(require.resolve('./remotion/index.ts'));

    const videoPath = path.resolve(__dirname, './public/BigBuckBunny.mp4');
    const videoData = await readVideoFile(videoPath);
    const durationInSeconds = await getVideoDuration(videoPath);

    if (durationInSeconds === null) {
        console.error('Failed to get video duration. Using default duration.');
        return;
    }

    const durationInFrames = Math.round(durationInSeconds * 30); // Assuming 30 fps

    const inputProps = {
        videoData,
        textOverlays: [
            { text: 'Hello', position: '100,100', startFrame: 0, endFrame: 90 },
            { text: 'World', position: '200,100', startFrame: 60, endFrame: 90 },
            { text: 'Always Visible', position: '400,500' }, // No startFrame or endFrame
        ],
    };

    const compositions = await getCompositions(bundleLocation, {
        inputProps,
    });

    const composition = compositions.find((c) => c.id === compositionId);

    await renderMedia({
        composition: {
            ...composition,
            durationInFrames,
        },
        serveUrl: bundleLocation,
        codec: 'h264',
        outputLocation: 'out/video10.mp4',
        inputProps,
    });
};

start().catch(console.error);
