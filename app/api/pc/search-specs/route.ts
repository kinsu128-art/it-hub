import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';

// POST - 모델명으로 사양정보 검색
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { modelName } = await request.json();

    if (!modelName || modelName.trim() === '') {
      return NextResponse.json({ error: 'Model name is required' }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error('OpenRouter API key not configured');
      return NextResponse.json(
        { error: 'API configuration error' },
        { status: 500 }
      );
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:8090',
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat',
        messages: [
          {
            role: 'user',
            content: `다음 PC/노트북 모델명의 사양정보를 JSON 형식으로 제공해줘. 모델명: "${modelName}"

            응답 형식 (JSON만):
            {
              "cpu": "CPU 모델명 (예: Intel Core i7-12700)",
              "ram": "RAM 용량 (예: 16GB DDR4)",
              "disk": "디스크 정보 (예: 512GB SSD)"
            }

            정확한 정보가 없다면 일반적인 사양정보로 제공해줘.
            JSON만 응답해주고 다른 설명은 하지 말아줘.`,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenRouter API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to search specifications' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // JSON 추출 및 파싱
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('No JSON found in API response:', content);
      return NextResponse.json(
        { error: 'Could not parse specifications' },
        { status: 400 }
      );
    }

    const specs = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      cpu: specs.cpu || '',
      ram: specs.ram || '',
      disk: specs.disk || '',
    });
  } catch (error) {
    console.error('Search specs error:', error);
    return NextResponse.json(
      { error: 'An error occurred while searching specifications' },
      { status: 500 }
    );
  }
}
