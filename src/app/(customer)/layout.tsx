import CustomerShell from '@/components/CustomerShell'

export default function Layout({ children }: { children: React.ReactNode }) {
  return <CustomerShell>{children}</CustomerShell>
}
