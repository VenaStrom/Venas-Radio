import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const audioUrl = searchParams.get('url');

  if (!audioUrl) {
    return NextResponse.json({ error: 'Missing audio URL' }, { status: 400 });
  }

  try {
    // Get range header from client request
    const range = request.headers.get('range');
    
    // Fetch the audio stream from SR API with better connection handling
    const fetchHeaders: HeadersInit = {
      'User-Agent': 'VR-Radio/1.0',
      'Accept': 'audio/*',
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache',
    };
    
    // Forward range requests for seeking and partial content
    if (range) {
      fetchHeaders['Range'] = range;
    }
    
    const response = await fetch(audioUrl, {
      headers: fetchHeaders,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch audio: ${response.status}`);
    }

    // Create a new response with proper CORS headers
    const audioResponse = new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
    });

    // Set CORS headers and connection handling
    audioResponse.headers.set('Access-Control-Allow-Origin', '*');
    audioResponse.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    audioResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Range');
    audioResponse.headers.set('Connection', 'keep-alive');
    audioResponse.headers.set('Keep-Alive', 'timeout=300, max=1000');
    
    // Copy important headers from the original response
    const headersToForward = [
      'content-type',
      'content-length',
      'accept-ranges',
      'content-range',
      'cache-control',
      'etag',
      'last-modified'
    ];

    headersToForward.forEach(header => {
      const value = response.headers.get(header);
      if (value) {
        audioResponse.headers.set(header, value);
      }
    });

    return audioResponse;
  } catch (error) {
    console.error('Audio proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy audio stream' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Range',
    },
  });
}
