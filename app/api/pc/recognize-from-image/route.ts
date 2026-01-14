import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const imageFile = formData.get('image') as File;

    if (!imageFile) {
      return NextResponse.json(
        { success: false, error: '이미지 파일이 필요합니다.' },
        { status: 400 }
      );
    }

    // 이미지를 base64로 변환
    const buffer = await imageFile.arrayBuffer();
    const base64Image = Buffer.from(buffer).toString('base64');
    const mimeType = imageFile.type || 'image/jpeg';

    // OpenRouter API 호출
    const openRouterApiKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterApiKey) {
      return NextResponse.json(
        { success: false, error: 'OpenRouter API 키가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    const openRouterResponse = await fetch('https://api.openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openRouterApiKey}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`,
                },
              },
              {
                type: 'text',
                text: `이 이미지에서 PC 정보를 추출해주세요. JSON 형식으로 다음 정보를 반환하세요:
{
  "model_name": "PC 모델명 (예: Dell XPS 15, ThinkPad X1)",
  "cpu": "CPU 정보 (있으면)",
  "ram": "RAM 정보 (있으면)",
  "serial_number": "시리얼 번호 또는 에셋 태그 (있으면)",
  "other_info": "기타 유용한 정보"
}

이미지에 라벨이나 스티커가 있으면 거기서 정보를 추출하세요. 없는 정보는 생략해도 됩니다.`,
              },
            ],
          },
        ],
        max_tokens: 500,
      }),
    });

    if (!openRouterResponse.ok) {
      const errorData = await openRouterResponse.json();
      console.error('OpenRouter API error:', errorData);
      return NextResponse.json(
        { success: false, error: 'AI 분석 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    const openRouterData = await openRouterResponse.json();
    const responseText = openRouterData.choices?.[0]?.message?.content;

    if (!responseText) {
      return NextResponse.json(
        { success: false, error: '분석 결과를 받을 수 없습니다.' },
        { status: 500 }
      );
    }

    // JSON 추출 (마크다운 코드 블록 처리)
    let jsonStr = responseText;
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    } else {
      // 직접 JSON인 경우
      const braceIndex = responseText.indexOf('{');
      if (braceIndex !== -1) {
        jsonStr = responseText.substring(braceIndex);
      }
    }

    const result = JSON.parse(jsonStr);

    return NextResponse.json({
      success: true,
      result: {
        model_name: result.model_name || '',
        cpu: result.cpu || '',
        ram: result.ram || '',
        serial_number: result.serial_number || '',
        other_info: result.other_info || '',
      },
    });
  } catch (error) {
    console.error('Image recognition error:', error);

    // JSON 파싱 실패 등의 경우
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { success: false, error: 'AI 응답을 파싱할 수 없습니다. 다시 시도해주세요.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: false, error: '이미지 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
