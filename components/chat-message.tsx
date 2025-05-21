import { cn } from '@/lib/utils'
import type { ChatMessage } from '@/hooks/use-realtime-chat'

interface ChatMessageItemProps {
  message: ChatMessage
  isOwnMessage: boolean
  showHeader: boolean
}

export const ChatMessageItem = ({ message, isOwnMessage, showHeader }: ChatMessageItemProps) => {
  return (
    <div className={`flex mt-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div
        className={cn('max-w-[100%] w-fit flex flex-col gap-1', {
          'items-end': isOwnMessage,
        })}
      >
        {showHeader && (
          <div
          className={cn(
            'flex items-center gap-2 text-lg px-3 text-customCyan min-[1441px]:text-xl',
            {
              'justify-end flex-row-reverse': isOwnMessage,
            }
          )}
          >
            <span className={'font-medium'}>{message.user.name}</span>
            <span className="text-foreground/50 text-lg min-[1441px]:text-xl">
              {new Date(message.createdAt).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              })}
            </span>
          </div>
        )}
        <div
          className={cn(
            'mx-4 py-2 px-3 border border-gray-500 rounded-xl text-lg w-fit max-w-md min-[1441px]:text-xl',
            isOwnMessage
              ? 'bg-customCyan text-white'
              : 'bg-gray-200 text-black'
          )}
        >
          {message.content}
        </div>
      </div>
    </div>
  )
}
