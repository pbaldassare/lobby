import { Suspense } from 'react';
import { requireStaffPage } from '@/lib/auth/staff';
import { StaffNav } from '@/components/StaffNav';
import { SignOutButton } from '@/components/SignOutButton';

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const staff = await requireStaffPage();

  return (
    <div className="shell">
      <aside className="sidebar">
        <div>
          <div className="brand">Lobby</div>
          <p className="muted" style={{ marginTop: 8 }}>
            {staff.profile.display_name ?? 'Staff'} ·{' '}
            <span className="badge badge-gold">{staff.profile.role}</span>
          </p>
        </div>
        <StaffNav />
        <div style={{ marginTop: 'auto' }}>
          <SignOutButton />
        </div>
      </aside>
      <main className="main">
        <Suspense fallback={<p className="muted">Loading…</p>}>
          {children}
        </Suspense>
      </main>
    </div>
  );
}
