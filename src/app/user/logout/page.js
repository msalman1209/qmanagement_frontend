'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function UserLogout() {
  const router = useRouter();

  useEffect(() => {
    // Perform logout logic here
    // Clear session, tokens, etc.
    setTimeout(() => {
      router.push('/');
    }, 2000);
  }, [router]);

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="mb-4">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Logging out...</h2>
        <p className="text-gray-600">Please wait while we log you out securely.</p>
      </div>
    </div>
  );
}
