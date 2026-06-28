'use client';

import { Lock } from 'lucide-react';
import { useSession } from 'next-auth/react';

export default function UnauthorizedPage() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-[#0B132B] flex items-center justify-center p-8">
      <div className="border border-[rgba(255,75,43,0.3)] bg-[rgba(255,75,43,0.04)] p-12 flex flex-col items-center gap-6 max-w-md w-full text-center">
        <div className="w-16 h-16 border border-[rgba(255,75,43,0.3)] flex items-center justify-center">
          <Lock size={28} className="text-[#FF4B2B]" />
        </div>

        <div className="flex flex-col gap-2">
          <span className="font-mono text-[10px] tracking-[0.15em] text-[rgba(255,75,43,0.5)]">ERROR / 403</span>
          <h1 className="font-mono text-[18px] tracking-tight font-bold text-white uppercase">
            Access Denied
          </h1>
          <p className="font-mono text-[12px] text-[rgba(255,255,255,0.5)] leading-relaxed">
            {session?.user?.name ? `${session.user.name}, you` : 'You'} do not have the required role to view this page.
          </p>
        </div>

        <div className="border-t border-[rgba(255,75,43,0.15)] pt-6 w-full flex flex-col items-center gap-3">
          <a
            href="/"
            className="w-full py-3 font-mono text-[11px] tracking-widest uppercase text-center border border-[rgba(0,242,254,0.3)] text-[#00F2FE] bg-[rgba(0,242,254,0.04)] hover:bg-[rgba(0,242,254,0.08)] transition-colors"
          >
            Return to Dashboard
          </a>
          <span className="font-mono text-[10px] text-[rgba(0,242,254,0.3)] tracking-wider">
            CONTACT AN ADMINISTRATOR IF YOU BELIEVE THIS IS AN ERROR
          </span>
        </div>
      </div>
    </div>
  );
}
