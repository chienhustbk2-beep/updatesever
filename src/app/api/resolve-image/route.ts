import { NextRequest, NextResponse } from 'next/server';

const HOST_PATTERNS = [
  { host: 'ibb.co', regex: /https?:\/\/(?:www\.)?ibb\.co\/([a-zA-Z0-9]+)/ },
  { host: 'freeimage.host', regex: /https?:\/\/(?:www\.)?freeimage\.host\/(?:i\/)?([a-zA-Z0-9]+)/ },
  { host: 'postimg.cc', regex: /https?:\/\/(?:www\.)?postimg\.cc\/([a-zA-Z0-9]+)/ },
  { host: 'imgur.com', regex: /https?:\/\/(?:www\.)?(?:i\.)?imgur\.com\/([a-zA-Z0-9]+)/ },
];

async function fetchDirectUrl(pageUrl: string): Promise<string | null> {
  try {
    const response = await fetch(pageUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ImageResolver/1.0)' },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return null;
    const html = await response.text();

    const ogMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i)
      || html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i);
    if (ogMatch) return ogMatch[1];

    const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
    if (imgMatch) {
      const src = imgMatch[1];
      if (src.startsWith('http')) return src;
      if (src.startsWith('//')) return 'https:' + src;
    }

    return null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Missing url' }, { status: 400 });
    }

    let trimmed = url.trim();

    const bbcodeMatch = trimmed.match(/\[img\](https?:\/\/[^\]]+)\[\/img\]/i);
    if (bbcodeMatch) trimmed = bbcodeMatch[1];

    const isDirectImage = /\.(jpg|jpeg|png|gif|webp|avif|bmp|svg)(\?.*)?$/i.test(trimmed);
    if (isDirectImage) {
      return NextResponse.json({ directUrl: trimmed });
    }

    const matchesHost = HOST_PATTERNS.some(p => trimmed.includes(p.host));
    if (!matchesHost) {
      return NextResponse.json({ directUrl: trimmed });
    }

    const directUrl = await fetchDirectUrl(trimmed);
    if (directUrl) {
      return NextResponse.json({ directUrl });
    }

    return NextResponse.json({ directUrl: trimmed });
  } catch {
    return NextResponse.json({ error: 'Failed to resolve image' }, { status: 500 });
  }
}
