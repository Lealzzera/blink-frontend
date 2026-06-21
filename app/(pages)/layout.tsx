import { ChatProvider } from '@/app/context/chatContext';
import SidebarComponent from '../components/SidebarComponent/SidebarComponent';
import { UserProvider } from '../context/userContext';
import style from './style.module.css';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <UserProvider>
        <ChatProvider>
          <aside>
            <SidebarComponent />
          </aside>
          <main className={style.mainContent}>{children}</main>
        </ChatProvider>
      </UserProvider>
    </div>
  );
}
