import Anthropic from '@anthropic-ai/sdk';
import { getStickerData } from '../../data/stickers';

const client = new Anthropic(); // uses process.env.ANTHROPIC_API_KEY server-side only

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const { base64 } = body as { base64: string };

    if (!base64) {
      return Response.json({ error: 'Missing base64 image' }, { status: 400 });
    }

    const WC = getStickerData();

    // Build a compact sticker lookup: "1:Ronaldo(player,POR) 2:Messi(player,ARG) ..."
    const catalogue = Object.values(WC.byNumber)
      .map(s => `${s.n}:${s.name}(${s.type},${s.teamId ?? s.special ?? ''})`)
      .join(' ');

    const message = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: base64,
              },
            },
            {
              type: 'text',
              text: `You are a Panini World Cup 2026 sticker expert. This image shows a page or set of stickers from the official album.

Sticker catalogue (number:name(type,team)):
${catalogue}

Identify every sticker number visible in this image. Return ONLY a JSON object in this exact format with no other text:
{"found":[<number>,<number>,...]}

If no stickers are recognisable, return: {"found":[]}`,
            },
          ],
        },
      ],
    });

    const textBlock = message.content.find(b => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return Response.json({ found: [] });
    }

    // extract JSON from the response (may have markdown fences)
    const raw = textBlock.text.trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return Response.json({ found: [] });
    }

    const parsed = JSON.parse(jsonMatch[0]) as { found: number[] };
    const valid = (parsed.found ?? [])
      .map(Number)
      .filter(n => Number.isInteger(n) && n >= 1 && n <= WC.total);

    return Response.json({ found: valid });
  } catch (err: any) {
    console.error('[scan+api]', err);
    return Response.json({ error: err?.message ?? 'Internal server error' }, { status: 500 });
  }
}
