import { UpdatePasswordForm } from '@/components/update-password-form'
import Link from 'next/link'

export default function UpdatePasswordPage() {
  return (
    <main className="flex flex-col min-h-screen items-center justify-center p-4">
      <UpdatePasswordForm />
    </main>
  )
}