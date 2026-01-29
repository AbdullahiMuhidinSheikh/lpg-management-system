import { NextRequest, NextResponse } from 'next/server';

const AI_BACKEND_URL = process.env.AI_BACKEND_URL || 'http://localhost:5000';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Call Python AI backend
    const response = await fetch(`${AI_BACKEND_URL}/api/ai/debt-risk-score`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`AI Backend error: ${response.statusText}`);
    }
    
    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Debt risk score error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to calculate risk score',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
