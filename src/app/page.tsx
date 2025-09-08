import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default function HomeRedirect() {
  const token = cookies().get('authToken')?.value
  redirect(token ? '/dashboard' : '/auth')
}