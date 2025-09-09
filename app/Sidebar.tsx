'use client';
import Image from 'next/image'
import Link from "next/link";
import { usePathname } from 'next/navigation';
import styles from "./styles/layout.module.css"; 
import { FaComments, FaChartBar, FaCalendarAlt, FaCog, FaUser, FaPaperPlane } from 'react-icons/fa';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { LogoutButton } from '@/components/logout-button'
import { motion } from 'framer-motion';


export default function Sidebar() {
  const pathname = usePathname();
  const hideMenu = pathname === '/auth/login' || pathname === '/auth/forgot-password';

  if (hideMenu) return null;

  // Animação para os ícones
  const iconVariants = {
    hover: {
      scale: 1.1,
      rotate: 5,
      transition: { duration: 0.3 }
    },
    tap: {
      scale: 0.95
    }
  };

  // Animação para a sidebar
  const sidebarVariants = {
    hidden: { opacity: 0, x: -50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  return (
    <motion.div 
      className="bigContainer"
      initial="hidden"
      animate="visible"
      variants={sidebarVariants}
    >
      <motion.div 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Image
          src="/images/apenas-img-blink.png"
          alt="Logo da blink"
          width={40}
          height={40}
          className={`${styles.image} hover:rotate-12 transition-transform duration-300`}
        />
      </motion.div>
      
      <motion.div className={styles.container} variants={sidebarVariants}>
        <motion.div className={styles.iconWrapper} variants={iconVariants} whileHover="hover" whileTap="tap">
          <Link href="/">
            <FaComments className="text-[#0f172a] text-[24px] 2xl:text-[32px] hover:text-customCyan transition-colors duration-300" />
          </Link>
        </motion.div>
        
        <motion.div className={styles.iconWrapper} variants={iconVariants} whileHover="hover" whileTap="tap">
          <Link href="/dashboard">
            <FaChartBar className="text-[#0f172a] text-[24px] 2xl:text-[32px] hover:text-customCyan transition-colors duration-300" />
          </Link>
        </motion.div>
        
        <motion.div className={styles.iconWrapper} variants={iconVariants} whileHover="hover" whileTap="tap">
          <Link href="/calendar">
            <FaCalendarAlt className="text-[#0f172a] text-[24px] 2xl:text-[32px] hover:text-customCyan transition-colors duration-300" />
          </Link>
        </motion.div>
        
        <motion.div className={styles.iconWrapper} variants={iconVariants} whileHover="hover" whileTap="tap">
          <Link href="/messageShot">
            <FaPaperPlane className="text-[#0f172a] text-[24px] 2xl:text-[32px] hover:text-customCyan transition-colors duration-300" />
          </Link>
        </motion.div>
    
        
        <motion.div className={styles.iconWrapper} variants={iconVariants} whileHover="hover" whileTap="tap">
          <Link href="/config">
            <FaCog className="text-[#0f172a] text-[24px] 2xl:text-[32px] hover:text-customCyan transition-colors duration-300" />
          </Link>
        </motion.div>      
        
        <motion.div variants={iconVariants} whileHover="hover" whileTap="tap">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button>
                <FaUser className="text-[#0f172a] text-[24px] hover:text-customCyan transition-colors duration-300" />
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
        </motion.div>
      </motion.div>
    </motion.div>
  );
}