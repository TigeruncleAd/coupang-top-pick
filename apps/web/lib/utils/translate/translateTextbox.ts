'use server'
import { AnalyzedTextBox } from '@/types/analyze/editor'
import OpenAI from 'openai'
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })
export type TranslatedTextBox = {
  id: string
  translated: string
  color: string
}
export async function translateTextbox({
  textToTranslate,
  image,
}: {
  textToTranslate: AnalyzedTextBox[]
  image: { mimeType: string; dataBase64: string }
}): Promise<TranslatedTextBox[]> {
  const promptText = [
    'You are an OCR + translation extractor.',
    'Provided text id and text :',
    textToTranslate.map(t => `${t.id}: ${t.original}`).join('\n'),
    'Task:',
    '1) Detect ALL visible text in the provided image.',
    '2) This Image is about some selling product on website. Provide its **Korean translation** with the whole context of the text.',
    '3) For each detected text box, ESTIMATE the color of the text in hex format (e.g., #000000). If uncertain, provide your best estimate',
    '4) match with the provided text id and return the translated text and color',
    '6) Return STRICT JSON with this schema (no extra text):',
    '{"boxes":[{"id":"string","translated":"string","color":string}]}',
  ].join('\n')
  const completion = await openai.chat.completions.create({
    model: 'gpt-5-mini',
    response_format: { type: 'json_object' },
    reasoning_effort: 'minimal',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: promptText },
          { type: 'image_url', image_url: { url: `data:${image.mimeType};base64,${image.dataBase64}` } },
        ],
      },
    ],
  })

  const text = completion.choices?.[0]?.message?.content || '{}'
  let parsed: any = null
  try {
    parsed = JSON.parse(text)
  } catch (e) {
    const match = text.match(/\{[\s\S]*\}/)
    if (match) {
      parsed = JSON.parse(match[0])
    } else {
      console.error(e)
      throw new Error('Failed to parse model response')
    }
  }
  return parsed.boxes
}
