"use client";

import { useState } from "react";
import ChatCardComponent from "../ChatCardComponent/ChatCardComponent";
import style from "./style.module.css";

type ChatListItem = {
  ai_answer: boolean;
  from_me: boolean;
  last_message: string;
  phone_number: string;
  picture_url: string;
  sent_at: string;
  whats_app_name: string;
};

type ChatListComponentProps = {
  chatList: ChatListItem[];
};

export default function ChatListComponent({
  chatList,
}: ChatListComponentProps) {
  const [cardSelected, setCardSelected] = useState<undefined | string>(
    undefined
  );
  const handleCardClick = (value: string) => {
    console.log(value);
    setCardSelected(value);
  };
  return (
    <div className={style.chatListContainer}>
      <ul className={style.chatListUl}>
        {chatList.map((item) => (
          <li key={item.phone_number}>
            <ChatCardComponent
              cardClick={() => handleCardClick(item.phone_number)}
              contactName={item.whats_app_name}
              imageUrl={item.picture_url}
              cardSelected={cardSelected}
              lastMessage={item.last_message}
              phoneNumber={item.phone_number}
              sentAt={item.sent_at}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
