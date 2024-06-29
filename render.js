/**
 * Video Composition Render Script
 *
 * This script is responsible for rendering a video composition based on input properties.
 * It's typically executed by the export-video server-side API.
 *
 * Key functionalities:
 * 1. Reads input properties from a temporary file
 * 2. Bundles the Remotion composition
 * 3. Retrieves video metadata (duration, dimensions)
 * 4. Renders the composition with text overlays
 * 5. Outputs the rendered video to the 'out' directory
 *
 * Input properties include:
 * - videoData: Base64 encoded video content
 * - videoPosition: Position of the video within the composition
 * - compositionSize: Dimensions of the entire composition
 * - textOverlays: Array of text overlay data (text, position)
 *
 * Process:
 * 1. Bundle the Remotion composition
 * 2. Read and process the input video file
 * 3. Calculate video duration and frame count
 * 4. Render the composition using Remotion's renderMedia
 * 5. Save the output video with a timestamp-based filename
 *
 * Output:
 * - Rendered video file in the 'out' directory
 * - Filename of the rendered video (written to stdout for further processing)
 *
 * Usage:
 * This script is executed by the server, and the resulting filename
 * is used to facilitate video download on the client side.
 *
 * Note: Ensure all necessary dependencies are installed and paths are correctly set.
 */

const {bundle} = require('@remotion/bundler');
const {getCompositions, renderMedia} = require('@remotion/renderer');
const ffprobe = require('ffprobe-static');
const {execFile} = require('child_process');
const {promisify} = require('util');
const path = require('path');
const fs = require('fs').promises;

const execFilePromise = promisify(execFile);

fs.mkdir(path.join(__dirname, 'out'), {recursive: true})
    .catch(console.error);

const getVideoDuration = async (videoPath) => {
    try {
        const {stdout} = await execFilePromise(ffprobe.path, [
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
        console.log('Attempting to read video file from:', videoPath);
        const data = await fs.readFile(videoPath);
        return `data:video/mp4;base64,${data.toString('base64')}`;
    } catch (error) {
        console.error('Error reading video file:', error);
        throw new Error('Failed to read video file');
    }
};

const start = async () => {
    console.log('Starting render process...');
    try {
        // Read input props from the temporary file
        const inputPropsPath = process.argv[2];
        console.log('Input props path:', inputPropsPath);
        const inputPropsJson = await fs.readFile(inputPropsPath, 'utf-8');
        const inputProps = JSON.parse(inputPropsJson);
        console.log('Input props:', JSON.stringify(inputProps, null, 2));

        // The composition you want to render
        const compositionId = 'VideoWithOverlays';

        const bundleLocation = await bundle(require.resolve('./remotion/index.ts'));

        // Correct the video path
        const videoPath = path.resolve(__dirname, 'public', inputProps.videoData.replace(/^\//, ''));
        console.log('Resolved video path:', videoPath);

        const videoData = await readVideoFile(videoPath);
        const durationInSeconds = await getVideoDuration(videoPath);

        if (durationInSeconds === null) {
            console.error('Failed to get video duration. Using default duration.');
            return;
        }

        const durationInFrames = Math.round(durationInSeconds * 30); // Assuming 30 fps

        console.log('Video path:', videoPath);
        console.log('Duration in seconds:', durationInSeconds);
        console.log('Duration in frames:', durationInFrames);

        const compositions = await getCompositions(bundleLocation, {
            inputProps: {...inputProps, videoData},
        });

        const composition = compositions.find((c) => c.id === compositionId);

        const timestamp = Date.now();
        const outputFileName = `video_${timestamp}.mp4`;
        const outputLocation = path.join('out', outputFileName);

        console.log('Starting renderMedia...');
        await renderMedia({
            composition: {
                ...composition,
                durationInFrames,
                width: inputProps.compositionSize.width,
                height: inputProps.compositionSize.height,
            },
            serveUrl: bundleLocation,
            codec: 'h264',
            outputLocation,
            inputProps: {...inputProps, videoData},
        });

        console.log('Render complete');
        console.log(`OUTPUT_FILENAME:${outputFileName}`); // Add this line
        return outputFileName;
    } catch (error) {
        console.error('Error in render process:', error);
        throw error;
    }
};

start().then((outputFileName) => {
    console.log('Output filename:', outputFileName);
    process.stdout.write(outputFileName); // Write the filename to stdout
}).catch(console.error);
