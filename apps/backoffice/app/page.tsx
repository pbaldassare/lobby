import { redirect } from 'next/navigation';
import { getStaffContext } from '@/lib/auth/staff';

export default async function HomePage() {
  const staff = await getStaffContext();
  redirect(staff ? '/istanze' : '/login');
}
