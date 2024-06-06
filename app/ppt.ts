'use server'
import { auth } from '@/auth'
import { kv } from '@vercel/kv'
import pptxgen from 'pptxgenjs'

import path from 'path'
import fs from 'fs'
import { promisify } from 'util'

const mkdir = promisify(fs.mkdir)
const writeFile = promisify(fs.writeFile)
interface IPPTData {
  data: string
  chatId: string
}
export async function addSlideData(data: string, chatId: string) {
  const session = await auth()

  if (session && session.user) {
    const userId = session.user.id // Assuming the user ID is stored here
    const pipeline = kv.pipeline()

    // Save the PPT data in a hash
    pipeline.hmset(`ppt:${chatId}`, { data, chatId })

    // Associate the PPT with the user in a sorted set
    pipeline.zadd(`user:ppt:${userId}`, {
      score: Date.now(),
      member: `ppt:${chatId}`
    })

    try {
      await pipeline.exec()
      console.log('Slide saved successfully.')
    } catch (error) {
      console.error('Error saving slide:', error)
    }
  } else {
    console.log('No active session or user found.')
    return
  }
}

export async function generatePPT(id: string): Promise<string> {
  const session = await auth()

  if (!session || !session.user) {
    throw new Error('No active session or user found.')
  }

  const userId = session.user.id
  const pptIds: string[] = await kv.zrange(`user:ppt:${userId}`, 0, -1)

  if (pptIds.length === 0) {
    throw new Error('No slides found for the user.')
  }

  // Fetch all PPT data
  const pptDataPromises: Promise<Record<string, unknown> | null>[] = pptIds.map(
    (pptId: string) => kv.hgetall(pptId)
  )
  const pptDataArray = (await Promise.all(
    pptDataPromises
  )) as unknown as IPPTData[]
  // Create a new presentation
  const pres = new pptxgen()
  pptDataArray
    .filter((pptData: IPPTData) => pptData.chatId == id)
    .forEach((pptData: IPPTData) => {
      const slide = pres.addSlide()
      slide.addText(pptData.data, {
        x: 1.5,
        y: 1.5,
        color: '363636',
        fill: { color: 'F1F1F1' },
        align: pres.AlignH.center
      })
    })

  // Define file path
  const fileName = `${id}-presentation.pptx`
  const filePath = path.join('downloads', fileName)

  // Ensure the directory exists
  await mkdir(path.dirname(filePath), { recursive: true })

  // Save the presentation
  await pres.writeFile({ fileName: filePath })

  // Return the download path
  return `/downloads/${fileName}`
}
