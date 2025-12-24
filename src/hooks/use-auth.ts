import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { authClient } from '@/lib/auth-client'

export const useAuth = () => {
  const router = useRouter()

  const signOut = async () => {
    try {
      const { error } = await authClient.signOut()

      if (error) throw new Error(error.message)

      toast.success('Signed out successfully')

      router.push('/sign-in')
      router.refresh()
    } catch (err) {
      toast.error("Couldn't sign out, please try again.")
    }
  }

  return { signOut }
}
