import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

export async function GET() {
  // For now, serve day-001.png from clawdia-glitch project.
  // In production this will serve today's generated piece from IPFS or local storage.
  const imgPath = path.join(os.homedir(), 'clawd/projects/clawdia-glitch/day-001.png');

  if (!fs.existsSync(imgPath)) {
    return new NextResponse('Image not found', { status: 404 });
  }

  const buffer = fs.readFileSync(imgPath);
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=300', // cache 5 minutes
    },
  });
}
