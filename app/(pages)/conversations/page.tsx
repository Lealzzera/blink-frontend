import style from "./style.module.css";
import ChatListComponent from "./components/ChatListComponent";

export default function Conversations() {
  return (
    <section className={style.conversationPageContainer}>
      <ChatListComponent />
      <div>
        <p>conversation page</p>
      </div>
    </section>
  );
}
