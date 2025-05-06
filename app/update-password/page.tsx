import { UpdatePasswordForm } from '@/components/update-password-form'
import Link from 'next/link'

export default function UpdatePasswordPage() {
  return (
    <main className="flex flex-col min-h-screen items-center justify-center p-4">
      <UpdatePasswordForm />
      <Link href="/protected" className='mt-4 border rounded ps-4 pe-4 pt-2 pb-2'>Voltar</Link>
    </main>
  )
}