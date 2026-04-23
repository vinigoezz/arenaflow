// src/app/page.tsx — Dashboard (root redirect to app)
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Dashboard from './dashboard/page'

export default async function RootPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  return <Dashboard />
}
