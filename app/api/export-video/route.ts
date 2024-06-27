import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';

const execAsync = promisify(exec);

export async function POST(request: Request) {
    try {
        const inputProps = await request.json();

        // Save input props to a temporary file
        await fs.writeFile('temp-input-props.json', JSON.stringify(inputProps));

        // Execute the export-video script with the temp file as an argument and capture output
        const { stdout, stderr } = await execAsync('npm run export-video -- temp-input-props.json');

        // Clean up the temporary file
        await fs.unlink('temp-input-props.json');

        return NextResponse.json({
            message: 'Video export process completed',
            stdout,
            stderr
        }, { status: 200 });
    } catch (error) {
        console.error('Error exporting video:', error);
        return NextResponse.json({ error: 'Failed to export video', details: error.message }, { status: 500 });
    }
}
