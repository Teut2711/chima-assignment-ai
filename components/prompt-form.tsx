'use client'

import * as React from 'react'
import Textarea from 'react-textarea-autosize'

import { useActions, useUIState } from 'ai/rsc'

import { UserMessage } from './stocks/message'
import { type AI } from '@/lib/chat/actions'
import { Button } from '@/components/ui/button'
import { IconArrowElbow, IconPlus, IconSpinner } from '@/components/ui/icons'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { useEnterSubmit } from '@/lib/hooks/use-enter-submit'
import { nanoid } from 'nanoid'
import { useRouter } from 'next/navigation'
import { addSlideData, generatePPT } from '@/app/pptUtils'
import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle
} from './ui/alert-dialog'

export function PromptForm({
  id,
  input,
  setInput
}: {
  id?: string
  input: string
  setInput: (value: string) => void
}) {
  const router = useRouter()
  const { formRef, onKeyDown } = useEnterSubmit()
  const inputRef = React.useRef<HTMLTextAreaElement>(null)
  const { submitUserMessage } = useActions()
  const [_, setMessages] = useUIState<typeof AI>()
  const [ppt, setPpt] = useState()
  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])
  const [open, setOpen] = useState(false)
  const handlePPTDownload = async () => {
    if (id !== null) {
      const pptData = await generatePPT(id as unknown as string)
      setPpt(pptData)
      setOpen(true)
      // router.push(`/ppt/${id}?pptData=${pptData}`)
    }
  }
  return (
    <form
      ref={formRef}
      onSubmit={async (e: any) => {
        e.preventDefault()

        // Blur focus on mobile
        if (window.innerWidth < 600) {
          e.target['message']?.blur()
        }

        const value = input.trim()
        setInput('')
        if (!value) return

        // Optimistically add user message UI
        setMessages(currentMessages => [
          ...currentMessages,
          {
            id: nanoid(),
            display: <UserMessage>{value}</UserMessage>
          }
        ])

        // Submit and get response message
        const responseMessage = await submitUserMessage(value)
        if (responseMessage !== undefined && responseMessage !== null) {
          await addSlideData(
            responseMessage.display as string,
            id as unknown as string
          )
        }

        setMessages(currentMessages => [...currentMessages, responseMessage])
      }}
    >
      {ppt && (
        <iframe
          src={`data:application/vnd.openxmlformats-officedocument.presentationml.presentation;base64,${ppt}`}
          width="0"
          height="0"
        ></iframe>
      )}
      <div className="relative flex max-h-60 w-full grow flex-col overflow-hidden bg-background px-8 sm:rounded-md sm:border sm:px-12">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="absolute left-0 top-[14px] size-8 rounded-full bg-background p-0 sm:left-4"
              onClick={() => {
                router.push('/new')
              }}
            >
              <IconPlus />
              <span className="sr-only">New Chat</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>New Chat</TooltipContent>
        </Tooltip>
        <Textarea
          ref={inputRef}
          tabIndex={0}
          onKeyDown={onKeyDown}
          placeholder="Send a message."
          className="min-h-[60px] w-full resize-none bg-transparent px-4 py-[1.3rem] focus-within:outline-none sm:text-sm"
          autoFocus
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          name="message"
          rows={1}
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        <Button onClick={handlePPTDownload}>Download PPT</Button>
        <div className="absolute right-0 top-[13px] sm:right-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="submit" size="icon" disabled={input === ''}>
                <IconArrowElbow />
                <span className="sr-only">Send message</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Send message</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </form>
  )
}
