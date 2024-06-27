import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

export async function POST(request: Request) {
    try {
        console.log('Received export request');
        const inputProps = await request.json();

        console.log('Saving input props to temp file');
        await fs.writeFile('temp-input-props.json', JSON.stringify(inputProps));

        console.log('Executing export-video script');
        const { stdout, stderr } = await execAsync('npm run export-video -- temp-input-props.json');
        console.log('Script output:', stdout);
        if (stderr) console.error('Script errors:', stderr);

        console.log('Cleaning up temp file');
        await fs.unlink('temp-input-props.json');

        const videoPath = path.resolve(process.cwd(), 'out', 'video1.mp4');
        console.log('Video path:', videoPath);

        console.log('Reading video file');
        const video = await fs.readFile(videoPath);
        console.log('Video file size:', video.length);

        console.log('Creating response');
        const response = new NextResponse(video);

        response.headers.set('Content-Disposition', `attachment; filename="exported_video.mp4"`);
        response.headers.set('Content-Type', 'video/mp4');

        console.log('Sending response');
        return response;
    } catch (error) {
        console.error('Error exporting video:', error);
        return NextResponse.json({ error: 'Failed to export video', details: error.message }, { status: 500 });
    }
}