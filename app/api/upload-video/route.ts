import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
    const data = await request.formData();
    const file: File | null = data.get('video') as unknown as File;

    if (!file) {
        return NextResponse.json({ success: false });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // With the file data in the buffer, you can do whatever you want with it.
    // For this example, we'll just write it to the public directory
    const filename = `video-${Date.now()}${path.extname(file.name)}`;
    const filepath = path.join(process.cwd(), 'public', filename);
    await writeFile(filepath, buffer);

    return NextResponse.json({ success: true, videoUrl: `/${filename}` });
}
