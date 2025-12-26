// Generate static params for all role-based routes
export function generateStaticParams() {
  return [
    { role: 'admin' },
    { role: 'receptionist' },
    { role: 'user' },
    { role: 'super-admin' }
  ];
}
