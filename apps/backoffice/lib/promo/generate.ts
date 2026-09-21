import {
  editorialCopy,
  promoSystemPrompt,
  promoUserPrompt,
  sanitizeCopy,
} from '@/lib/promo/copy';
import type { PromoCopy, PromoFacts } from '@/lib/promo/types';

type ChatCompletionResponse = {
  choices?: Array<{
    message?: { content?: string | null };
  }>;
  error?: { message?: string };
};

function openAiKey(): string | null {
  const key = process.env.OPENAI_API_KEY?.trim();
  return key && key.length > 0 ? key : null;
}

export async function generatePromoCopy(facts: PromoFacts): Promise<PromoCopy> {
  const fallback = editorialCopy(facts);
  const key = openAiKey();
  if (!key) return fallback;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: promoSystemPrompt() },
        { role: 'user', content: promoUserPrompt(facts) },
      ],
    }),
  });

  const data = (await res.json()) as ChatCompletionResponse;
  if (!res.ok) {
    throw new Error(data.error?.message ?? 'Generazione IA non riuscita.');
  }
  const content = data.choices?.[0]?.message?.content;
  if (!content) return fallback;

  let parsed: Partial<PromoCopy>;
  try {
    parsed = JSON.parse(content) as Partial<PromoCopy>;
  } catch {
    return fallback;
  }
  return sanitizeCopy({ ...parsed, model: 'gpt-4o-mini' }, facts);
}
