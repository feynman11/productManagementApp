import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { prisma } from '~/lib/prisma'
import { requireClientAuth, requireProductAuth } from '~/lib/auth.server'
import { canProductAdmin } from '~/lib/permissions'
import { openai } from '~/lib/openai'

export const detectDuplicateIdeas = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      productId: z.string(),
      title: z.string().min(1),
      description: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    const { clientId } = await requireClientAuth()

    // Verify product belongs to client
    const product = await prisma.product.findFirst({
      where: { id: data.productId, clientId },
    })
    if (!product) throw new Error('Product not found')

    // Get existing ideas for this product
    const existingIdeas = await prisma.idea.findMany({
      where: { productId: data.productId, clientId },
      select: { id: true, title: true, description: true, status: true },
      take: 100,
    })

    if (existingIdeas.length === 0) {
      return { duplicates: [], hasDuplicates: false }
    }

    const ideasList = existingIdeas
      .map((idea, i) => `${i + 1}. [${idea.id}] "${idea.title}" - ${idea.description.slice(0, 150)}`)
      .join('\n')

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.1,
      messages: [
        {
          role: 'system',
          content:
            'You are a product management assistant. Analyze whether a new idea is similar to existing ideas. Respond with a JSON array of objects with fields: id (string), title (string), similarity (number 0-1). Only include ideas with similarity > 0.5. Return empty array if no duplicates found.',
        },
        {
          role: 'user',
          content: `New idea:\nTitle: "${data.title}"\nDescription: "${data.description}"\n\nExisting ideas:\n${ideasList}\n\nReturn JSON array of similar ideas:`,
        },
      ],
      response_format: { type: 'json_object' },
    })

    try {
      const content = response.choices[0]?.message?.content ?? '{}'
      const parsed = JSON.parse(content) as { duplicates?: Array<{ id: string; title: string; similarity: number }> }
      const duplicates = parsed.duplicates ?? []
      return { duplicates, hasDuplicates: duplicates.length > 0 }
    } catch {
      return { duplicates: [], hasDuplicates: false }
    }
  })

export const analyzeIdeaSentiment = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ ideaId: z.string() }))
  .handler(async ({ data }) => {
    const { clientId } = await requireClientAuth()

    const idea = await prisma.idea.findFirst({
      where: { id: data.ideaId, clientId },
      include: { comments: { select: { content: true } } },
    })
    if (!idea) throw new Error('Idea not found')

    const { effectiveProductRole } = await requireProductAuth({ productId: idea.productId })
    if (!canProductAdmin(effectiveProductRole)) throw new Error('Product owner permission required')

    const commentText = idea.comments
      .map((c) => c.content)
      .join('\n---\n')

    const content = `Idea: "${idea.title}"\nDescription: ${idea.description}${commentText ? `\n\nComments:\n${commentText}` : ''}`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.1,
      messages: [
        {
          role: 'system',
          content:
            'You are a product management assistant. Analyze the sentiment of an idea and its comments. Respond with a JSON object containing: sentiment (positive/negative/neutral/mixed), score (number -1 to 1), summary (string, 1-2 sentences explaining the overall sentiment).',
        },
        {
          role: 'user',
          content,
        },
      ],
      response_format: { type: 'json_object' },
    })

    try {
      const result = response.choices[0]?.message?.content ?? '{}'
      return JSON.parse(result) as {
        sentiment: string
        score: number
        summary: string
      }
    } catch {
      return { sentiment: 'neutral', score: 0, summary: 'Unable to analyze sentiment' }
    }
  })

export const generateReleaseNotes = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ releaseId: z.string() }))
  .handler(async ({ data }) => {
    const { clientId } = await requireClientAuth()

    // Find release with its roadmap items (verify through roadmap -> client chain)
    const release = await prisma.release.findFirst({
      where: {
        id: data.releaseId,
        roadmap: { clientId },
      },
      include: {
        items: { select: { title: true, description: true, status: true } },
        roadmap: { select: { name: true, productId: true, product: { select: { name: true } } } },
      },
    })
    if (!release) throw new Error('Release not found')

    const { effectiveProductRole } = await requireProductAuth({ productId: release.roadmap.productId })
    if (!canProductAdmin(effectiveProductRole)) throw new Error('Product owner permission required')

    const itemsList = release.items
      .map((item) => `- ${item.title}: ${item.description ?? 'No description'} (${item.status})`)
      .join('\n')

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      messages: [
        {
          role: 'system',
          content:
            'You are a product management assistant. Generate professional release notes in markdown format. Include a brief introduction, list of features/changes grouped by category, and any notable improvements. Keep it concise and user-friendly.',
        },
        {
          role: 'user',
          content: `Generate release notes for:\nProduct: ${release.roadmap.product.name}\nRelease: ${release.name} - ${release.description ?? ''}\nTarget date: ${release.targetDate?.toISOString().split('T')[0] ?? 'TBD'}\n\nItems:\n${itemsList}`,
        },
      ],
    })

    return {
      markdown: response.choices[0]?.message?.content ?? '# Release Notes\n\nNo content generated.',
      releaseName: release.name,
      productName: release.roadmap.product.name,
    }
  })
