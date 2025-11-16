"use client";

import SidebarComponent from "../components/SidebarComponent/SidebarComponent";
import style from "./style.module.css";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <aside>
        <SidebarComponent />
      </aside>
      <main className={style.mainContent}>{children}</main>
    </div>
  );
}
