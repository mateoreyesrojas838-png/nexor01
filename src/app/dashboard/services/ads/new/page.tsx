import { redirect } from 'next/navigation'

export default function NewAdRedirect() {
    redirect('/dashboard/services/ads/wizard')
}
