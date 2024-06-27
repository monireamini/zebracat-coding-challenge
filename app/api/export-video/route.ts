import {NextResponse} from 'next/server';
import {exec} from 'child_process';
import {promisify} from 'util';

const execAsync = promisify(exec);

export async function POST() {
    try {
        // Execute the export-video script
        await execAsync('npm run export-video');

        return NextResponse.json({message: 'Video exported successfully!'}, {status: 200});
    } catch (error) {
        console.error('Error exporting video:', error);
        return NextResponse.json({error: 'Failed to export video'}, {status: 500});
    }
}
