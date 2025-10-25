import { cn } from '@/lib/utils'
import type { ChatMessage } from '@/hooks/use-realtime-chat'

interface ChatMessageItemProps {
  message: ChatMessage
  isOwnMessage: boolean
  showHeader: boolean
}

const hoje = new Date();

const dia = String(hoje.getDate()).padStart(2, "0");
const mes = String(hoje.getMonth() + 1).padStart(2, "0");
const ano = String(hoje.getFullYear()).slice(-2);
const horas = String(hoje.getHours()).padStart(2, "0");
const minutos = String(hoje.getMinutes()).padStart(2, "0");

const dataFormatada = `${dia}/${mes}/${ano}, ${horas}:${minutos}`;

console.log(dataFormatada);


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
              {message.createdAt}  {/*  === dataFormatada ? "Hoje" : message.createdAt / A alteracao foi aqui, estava so message.createdAt. O problema eh que isso so vai dar certo se ate o horario for igual */}
            </span>
          </div>
        )}
        <div
          className={cn(
            'mx-4 py-1 px-3 border border-bg-customCyan rounded-xl text-lg w-fit max-w-md min-[1441px]:text-xl',
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


/**
 
  .toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })\

 */