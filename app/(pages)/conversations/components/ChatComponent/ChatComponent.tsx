"use client";

import { getConversationMessages } from "@/app/actions/getConversationMessages";
import { useCallback, useEffect, useRef, useState } from "react";
import MessageComponent from "../MessageComponent/MessageComponent";
import style from "./style.module.css";
import { useUser } from "@/app/context/userContext";
import { Send } from "lucide-react";

type ChatComponentProps = {
  phoneNumber: string | null;
  clinicId: number | null;
};

export default function ChatComponent({
  phoneNumber,
  clinicId,
}: ChatComponentProps) {
  const [loading, setLoading] = useState(false);
  const [messageList, setMessageList] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const chatRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { numberSelected } = useUser();

  const maxHeight = 150;

  const fetchMessageList = useCallback(async () => {
    if (!clinicId || loading || !phoneNumber) return;

    setLoading(true);
    try {
      const response = await getConversationMessages({
        clinicId,
        phoneNumber,
      });
      setMessageList(response);
    } catch (err) {
      console.error("Error to fetch messages:", err);
    } finally {
      setLoading(false);
    }
  }, [clinicId, loading, phoneNumber]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    const value = e.target.value;
    setMessage(value);

    if (!textarea) return;

    textarea.style.height = "auto";
    const newHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${newHeight}px`;
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;

    setMessage("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "40px";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && e.shiftKey) return;
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    setMessageList([]);
    fetchMessageList();
  }, [phoneNumber]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messageList]);

  return (
    <div ref={chatRef} className={style.chatContainer}>
      <ul className={style.chatUl}>
        {messageList.length > 0 &&
          !loading &&
          messageList.map((message, index) => (
            <li
              className={message.from_me ? style.fromMe : style.fromPatient}
              key={index}
            >
              <MessageComponent message={message} />
            </li>
          ))}
      </ul>

      <div className={style.textAreaContainer}>
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className={style.textArea}
        />

        <button onClick={handleSendMessage} className={style.textAreaButton}>
          <Send className={style.buttonIcon} />
        </button>
      </div>
    </div>
  );
}
