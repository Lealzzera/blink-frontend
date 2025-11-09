"use client";

import style from "./style.module.css";
import ChatListComponent from "./components/ChatListComponent/ChatListComponent";
import { useEffect, useState } from "react";
import { getConversations } from "@/app/actions/getConversations";
import { useUser } from "@/app/context/userContext";

export default function Conversations() {
  const { clinicId } = useUser();
  const [chatList, setChatList] = useState([]);

  const fetchConversationsList = async () => {
    const response = await getConversations({ clinicId });
    setChatList(response);
  };

  useEffect(() => {
    if (!clinicId) return;
    (async () => {
      await fetchConversationsList();
    })();
  }, [clinicId]);

  return (
    <section className={style.conversationPageContainer}>
      {chatList ? (
        <ChatListComponent chatList={chatList} />
      ) : (
        <div>Loading...</div>
      )}
      <div>
        <p>conversation page</p>
      </div>
    </section>
  );
}
