import { AuthGate } from '@/components/auth-gate';

export default function Home() {
  const environment = process.env.VERCEL_ENV === 'production' ? 'Production' : process.env.VERCEL_ENV === 'preview' ? 'Preview · DEV' : 'Local · DEV';
  return <AuthGate environment={environment} />;
}
