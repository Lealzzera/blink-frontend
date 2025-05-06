'use client';
import Image from 'next/image'
import Link from "next/link";
import { usePathname } from 'next/navigation';
import styles from "./styles/layout.module.css"; 
import { FaComments, FaChartBar, FaCalendarAlt, FaCog, FaUser } from 'react-icons/fa';

export default function Sidebar() {
  const pathname = usePathname();
  const hideMenu = pathname === '/auth/login';

  if (hideMenu) return null;

  return (
    <div className="bigContainer">
      <Image
      src="/images/apenas-img-blink.png"
      alt="Descrição da imagem"
      width={65}
      height={65}
      className='absolute top-2 left-4'
    />
      <div className={styles.container}>
      <Link href="/">
      <FaComments className="text-[#0f172a] text-[24px] transition-transform duration-200 hover:scale-105" />
      </Link>
      <Link href="/dashboard">
        <FaChartBar className="text-[#0f172a] text-[24px] transition-transform duration-200 hover:scale-105" />
      </Link>
      <Link href="/calendar">
        <FaCalendarAlt className="text-[#0f172a] text-[24px] transition-transform duration-200 hover:scale-105" />
      </Link>
      <Link href="/protected">
        <FaUser className="text-[#0f172a] text-[24px] transition-transform duration-200 hover:scale-105" />
      </Link>
      <Link href="/config">
        <FaCog className="text-[#0f172a] text-[24px] transition-transform duration-200 hover:scale-105" />
      </Link>

      </div>
    </div>
  );
}
