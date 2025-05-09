'use client';
import Image from 'next/image'
import Link from "next/link";
import { usePathname } from 'next/navigation';
import styles from "./styles/layout.module.css"; 
import { FaComments, FaChartBar, FaCalendarAlt, FaCog, FaUser } from 'react-icons/fa';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { LogoutButton } from '@/components/logout-button'

export default function Sidebar() {
  const pathname = usePathname();
  const hideMenu = pathname === '/auth/login' || pathname === '/auth/forgot-password';

  if (hideMenu) return null;

  return (
    <div className="bigContainer">
      <Image
      src="/images/apenas-img-blink.png"
      alt="Logo da blink"
      width={40}
      height={40}
      className={styles.image}
    />
      <div className={styles.container}>

      <Link href="/">
        <FaComments className="text-[#0f172a] text-[24px] 2xl:text-[32px] transition-transform duration-200 hover:scale-105" />
      </Link>
      <Link href="/dashboard">
        <FaChartBar className="text-[#0f172a] text-[24px] 2xl:text-[32px] transition-transform duration-200 hover:scale-105" />
      </Link>
      <Link href="/calendar">
        <FaCalendarAlt className="text-[#0f172a] text-[24px] 2xl:text-[32px] transition-transform duration-200 hover:scale-105" />
      </Link>
      <Link href="/config">
        <FaCog className="text-[#0f172a] text-[24px] 2xl:text-[32px] transition-transform duration-200 hover:scale-105" />
      </Link>
      
      <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button>
          <FaUser className="text-[#0f172a] text-[24px] transition-transform duration-200 hover:scale-105" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48 border border-white bg-slate-200 text-black rounded ms-2">
        <DropdownMenuItem>
          <Link href="/update-password">Redefinir senha</Link>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <LogoutButton />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
        
      </div>
    </div>
  );
}
