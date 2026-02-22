import SidebarComponent from "../components/SidebarComponent/SidebarComponent";
import style from "./style.module.css";
import { ChatProvider } from "@/app/context/chatContext";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <ChatProvider>
        <aside>
          <SidebarComponent />
        </aside>
        <main className={style.mainContent}>{children}</main>
      </ChatProvider>
    </div>
  );
}
