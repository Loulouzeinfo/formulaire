import { AuthGate } from '@/components/auth-gate';

export default function Home() {
  const environment = process.env.VERCEL_ENV === 'production' ? 'PROD' : 'DEV';
  return <AuthGate environment={environment} />;
}
