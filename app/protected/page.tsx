import { redirect } from 'next/navigation'

import { LogoutButton } from '@/components/logout-button'
import { createClient } from '@/lib/server'
import styles from "./protected.module.css";
import Link from 'next/link'

export default async function ProtectedPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect('/auth/login')
  }

  return (
    <div className={styles.container} >
      <h1 className={styles.title}>Sistema Blink</h1>
      <p>
        Olá, <span>{data.user.email}.</span>
      </p>
      <LogoutButton />
      <Link href="/update-password" className="text-blue-600 underline">
        Redefinir senha
      </Link>
    </div>
  )
}
