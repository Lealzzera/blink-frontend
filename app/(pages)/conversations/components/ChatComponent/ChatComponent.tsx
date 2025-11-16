"use client";

import { getConversationMessages } from "@/app/actions/getConversationMessages";
import { useCallback, useEffect, useRef, useState } from "react";
import MessageComponent from "../MessageComponent/MessageComponent";
import style from "./style.module.css";
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
  const [hasMore, setHasMore] = useState(true);
  const [message, setMessage] = useState("");
  const [pageNumber, setPageNumber] = useState(0);

  const chatRef = useRef<HTMLDivElement | null>(null);
  const ulRef = useRef<HTMLUListElement | null>(null);

  const prevScrollTopRef = useRef(0);
  const prevScrollHeightRef = useRef(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const observer = useRef<IntersectionObserver | null>(null);
  const maxHeight = 150;

  const fetchMore = () => {
    if (!hasMore || loading) return;
    fetchMessageList(pageNumber + 1);
  };

  const firstListItem = useCallback(
    (node: HTMLLIElement | null) => {
      if (loading) return;

      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          if (entry.isIntersecting && hasMore && !loading) {
            fetchMore();
          }
        },
        {
          threshold: 0,
          root: chatRef.current,
        }
      );

      if (node) observer.current.observe(node);
    },
    [loading, hasMore]
  );

  const withStableId = (msg: any) => ({
    ...msg,
    _id: `${msg.sent_at}-${msg.from_me ? "me" : "them"}-${
      msg.body ?? msg.text ?? ""
    }`,
  });

  const fetchMessageList = useCallback(
    async (page: number) => {
      if (!clinicId || !phoneNumber || loading) return;

      if (page > 0 && ulRef.current) {
        prevScrollHeightRef.current = ulRef.current.scrollHeight;
        prevScrollTopRef.current = ulRef.current.scrollTop;
      }

      setLoading(true);
      try {
        const response = await getConversationMessages({
          clinicId,
          phoneNumber,
          page,
        });

        if (!response || response.length === 0) {
          setHasMore(false);
          return;
        }

        const sortedResponse = [...response].sort(
          (a, b) =>
            new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime()
        );

        if (page === 0) {
          const normalized = sortedResponse.map(withStableId);

          setMessageList(normalized);
        }

        if (page > 0) {
          setMessageList((prev) => {
            const existingIds = new Set(prev.map((m: any) => m._id));
            const incoming = sortedResponse
              .map(withStableId)
              .filter((m) => !existingIds.has(m._id));

            const merged = [...incoming, ...prev];

            return merged.sort(
              (a, b) =>
                new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime()
            );
          });
        }

        setPageNumber(page);
      } catch (err) {
        console.error("Error fetching messages:", err);
      } finally {
        setLoading(false);
      }
    },
    [clinicId, phoneNumber, loading]
  );

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
    console.log("Mensagem enviada:", message);
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
    if (!phoneNumber) return;
    setMessageList([]);
    setPageNumber(0);
    setHasMore(true);
    fetchMessageList(0);
  }, [phoneNumber]);

  useEffect(() => {
    const container = ulRef.current;
    if (!container || messageList.length === 0) return;

    if (pageNumber === 0) {
      container.scrollTop = container.scrollHeight;
      return;
    }

    if (pageNumber > 0 && prevScrollHeightRef.current !== 0) {
      const newScrollHeight = container.scrollHeight;
      const oldScrollHeight = prevScrollHeightRef.current;
      const oldScrollTop = prevScrollTopRef.current;

      const heightDifference = newScrollHeight - oldScrollHeight;

      container.scrollTop = oldScrollTop + heightDifference;

      prevScrollHeightRef.current = 0;
      prevScrollTopRef.current = 0;
    }
  }, [messageList, pageNumber]);

  return (
    <div ref={chatRef} className={style.chatContainer}>
      {loading && pageNumber > 0 && (
        <div className={style.dots}>
          <span></span>
          <span></span>
          <span></span>
        </div>
      )}
      <ul ref={ulRef} className={style.chatUl}>
        {messageList.map((message, index) => {
          const isFirst = index === 0;
          return (
            <li
              key={message._id}
              ref={isFirst ? firstListItem : null}
              className={message.from_me ? style.fromMe : style.fromPatient}
            >
              <MessageComponent message={message} />
            </li>
          );
        })}
      </ul>
      <div className={style.textAreaContainer}>
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className={style.textArea}
          placeholder="Digite sua mensagem..."
        />
        <button onClick={handleSendMessage} className={style.textAreaButton}>
          <Send className={style.buttonIcon} />
        </button>
      </div>
    </div>
  );
}
