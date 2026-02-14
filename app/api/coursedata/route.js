import { NextResponse } from 'next/server';

const scraper = require('@/lib/scraper');

export async function GET() {
  try {
    const data = await scraper.getCourseData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching course data:', error);
    return NextResponse.json({ error: 'Failed to fetch course data' }, { status: 500 });
  }
}
