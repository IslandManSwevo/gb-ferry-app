'use client';

import { LogIn, LogOut, Shield, User } from 'lucide-react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';

function SignInContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  useEffect(() => {
    if (status === 'authenticated' && session) {
      const safeUrl = (() => {
        if (callbackUrl.startsWith('/') && !callbackUrl.startsWith('//')) {
          return callbackUrl;
        }
        try {
          const target = new URL(callbackUrl, window.location.origin);
          if (target.origin === window.location.origin) {
            return target.pathname + target.search + target.hash;
          }
        } catch (_) {}
        return '/';
      })();
      router.replace(safeUrl);
    }
  }, [status, session, router, callbackUrl]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#0B132B] flex items-center justify-center">
        <div className="w-6 h-6 border border-[#00F2FE] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (session) {
    return (
      <div className="min-h-screen bg-[#0B132B] flex items-center justify-center p-8">
        <div className="border border-[rgba(0,242,254,0.2)] bg-[#0B132B] p-10 flex flex-col items-center gap-6 w-full max-w-sm text-center">
          <div className="w-14 h-14 border border-[rgba(0,242,254,0.3)] flex items-center justify-center">
            <User size={24} className="text-[rgba(0,242,254,0.6)]" />
          </div>

          <div className="flex flex-col gap-1">
            <span className="font-mono text-[10px] tracking-[0.15em] text-[rgba(0,242,254,0.4)]">SESSION ACTIVE</span>
            <h1 className="font-mono text-[14px] tracking-tight font-bold text-[rgba(0,242,254,0.9)] uppercase">
              Welcome, {session.user?.name}
            </h1>
            <span className="font-mono text-[11px] text-[rgba(0,242,254,0.4)]">{session.user?.email}</span>
            {session.user?.roles?.length ? (
              <span className="font-mono text-[10px] px-2 py-0.5 border border-[rgba(0,242,254,0.3)] text-[#00F2FE] bg-[rgba(0,242,254,0.04)] tracking-widest mt-1 self-center">
                {session.user.roles.join(', ')}
              </span>
            ) : null}
          </div>

          <div className="w-full flex flex-col gap-2 border-t border-[rgba(0,242,254,0.08)] pt-6">
            <a
              href="/"
              className="w-full py-2.5 font-mono text-[11px] tracking-widest uppercase text-center border border-[rgba(0,242,254,0.3)] text-[#00F2FE] bg-[rgba(0,242,254,0.04)] hover:bg-[rgba(0,242,254,0.08)] transition-colors"
            >
              Go to Dashboard
            </a>
            <button
              onClick={() => signOut({ callbackUrl: '/auth/signin' })}
              className="w-full py-2.5 font-mono text-[11px] tracking-widest uppercase text-center border border-[rgba(255,75,43,0.2)] text-[rgba(255,75,43,0.6)] hover:text-[#FF4B2B] hover:border-[rgba(255,75,43,0.4)] transition-colors flex items-center justify-center gap-2"
            >
              <LogOut size={11} />
              Sign Out
            </button>
            <span className="font-mono text-[10px] text-[rgba(0,242,254,0.25)] tracking-wider mt-1">
              REDIRECTING TO YOUR DESTINATION...
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B132B] flex items-center justify-center p-8">
      <div className="border border-[rgba(0,242,254,0.15)] bg-[#0B132B] p-10 flex flex-col items-center gap-8 w-full max-w-sm">
        {/* Branding */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-16 h-16 border border-[rgba(0,242,254,0.2)] bg-[rgba(0,242,254,0.04)] flex items-center justify-center">
            <Shield size={28} className="text-[rgba(0,242,254,0.5)]" />
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="font-mono text-[14px] tracking-[0.05em] uppercase font-bold text-[rgba(0,242,254,0.9)]">
              Grand Bahama Ferry
            </h1>
            <span className="font-mono text-[10px] tracking-[0.12em] text-[rgba(0,242,254,0.4)] uppercase">
              Maritime Compliance Platform
            </span>
          </div>
        </div>

        {/* Auth block */}
        <div className="w-full flex flex-col gap-4">
          <div className="border-t border-[rgba(0,242,254,0.08)] pt-6 flex flex-col gap-3">
            <button
              onClick={() => signIn('keycloak', { callbackUrl: '/' })}
              className="w-full py-3 font-mono text-[12px] tracking-widest uppercase bg-[#00F2FE] text-[#0B132B] font-bold hover:bg-[rgba(0,242,254,0.85)] transition-colors flex items-center justify-center gap-2"
            >
              <LogIn size={13} />
              Sign in with Keycloak
            </button>
            <span className="font-mono text-[10px] text-[rgba(0,242,254,0.3)] tracking-widest text-center">
              ENTERPRISE SINGLE SIGN-ON
            </span>
          </div>

          <span className="font-mono text-[10px] text-[rgba(0,242,254,0.2)] tracking-wider text-center">
            If sign-in doesn&apos;t work, open in a browser:{' '}
            <a href="/auth/signin" target="_blank" rel="noopener noreferrer" className="text-[rgba(0,242,254,0.4)] hover:text-[#00F2FE] transition-colors underline">
              Sign In Page
            </a>
          </span>
        </div>
      </div>
    </div>
  );
}

function SignInFallback() {
  return (
    <div className="min-h-screen bg-[#0B132B] flex items-center justify-center">
      <div className="w-6 h-6 border border-[#00F2FE] border-t-transparent animate-spin" />
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<SignInFallback />}>
      <SignInContent />
    </Suspense>
  );
}
