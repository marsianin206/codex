// Simple test handler that returns 200
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    message: 'Auth works!', 
    timestamp: new Date().toISOString() 
  });
}

export async function POST() {
  return NextResponse.json({ 
    message: 'Auth works!',
    timestamp: new Date().toISOString() 
  });
}