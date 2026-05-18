import OpenAI from 'openai'
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions'
import { DRAWIO_SYSTEM_PROMPT } from './drawio-skill'

export interface ChatSettings {
  apiKey: string
  baseURL: string
  model: string
}

export type ChatMessage = {
  role: 'user' | 'assistant' | 'system'
  content: string
}

function createClient(settings: ChatSettings): OpenAI {
  return new OpenAI({
    apiKey: settings.apiKey || 'no-key',
    baseURL: settings.baseURL.replace(/\/$/, ''),
    dangerouslyAllowBrowser: true
  })
}

export async function streamChat(
  settings: ChatSettings,
  history: ChatMessage[],
  onDelta: (text: string) => void,
  signal?: AbortSignal
): Promise<string> {
  const client = createClient(settings)
  const messages: ChatCompletionMessageParam[] = [
    { role: 'system', content: DRAWIO_SYSTEM_PROMPT },
    ...history.map((m) => ({ role: m.role, content: m.content }))
  ]

  const stream = await client.chat.completions.create(
    {
      model: settings.model,
      messages,
      stream: true,
      temperature: 0.4
    },
    { signal }
  )

  let full = ''
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content ?? ''
    if (delta) {
      full += delta
      onDelta(delta)
    }
  }
  return full
}
