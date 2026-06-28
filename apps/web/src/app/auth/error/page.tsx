'use client';

import { AlertTriangle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const ERROR_MESSAGES: Record<string, { title: string; description: string }> = {
  Configuration: {
    title: 'Configuration Error',
    description: 'There is a problem with the server configuration. Contact your system administrator.',
  },
  AccessDenied: {
    title: 'Access Denied',
    description: 'You do not have permission to access this application.',
  },
  Verification: {
    title: 'Verification Error',
    description: 'The verification link may have expired or already been used.',
  },
  Default: {
    title: 'Authentication Error',
    description: 'An error occurred during authentication. Please try again.',
  },
};

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error') ?? 'Default';
  const { title, description } = ERROR_MESSAGES[error] ?? ERROR_MESSAGES.Default;

  return (
    <div className="border border-[rgba(255,75,43,0.3)] bg-[rgba(255,75,43,0.04)] p-10 flex flex-col items-center gap-6 w-full max-w-md text-center">
      <div className="w-14 h-14 border border-[rgba(255,75,43,0.3)] flex items-center justify-center">
        <AlertTriangle size={24} className="text-[#FF4B2B]" />
      </div>

      <div className="flex flex-col gap-2">
        <span className="font-mono text-[10px] tracking-[0.15em] text-[rgba(255,75,43,0.5)]">AUTH / FAILURE</span>
        <h1 className="font-mono text-[15px] tracking-tight font-bold text-white uppercase">{title}</h1>
        <p className="font-mono text-[12px] text-[rgba(255,255,255,0.5)] leading-relaxed">{description}</p>
        {error && error !== 'Default' && (
          <span className="font-mono text-[10px] text-[rgba(255,75,43,0.4)] tracking-widest mt-1">
            CODE: {error.toUpperCase()}
          </span>
        )}
      </div>

      <div className="border-t border-[rgba(255,75,43,0.15)] pt-6 w-full flex flex-col gap-2">
        <a
          href="/auth/signin"
          className="w-full py-2.5 font-mono text-[11px] tracking-widest uppercase text-center border border-[rgba(0,242,254,0.3)] text-[#00F2FE] bg-[rgba(0,242,254,0.04)] hover:bg-[rgba(0,242,254,0.08)] transition-colors"
        >
          Try Again
        </a>
        <a
          href="/"
          className="w-full py-2.5 font-mono text-[11px] tracking-widest uppercase text-center border border-[rgba(0,242,254,0.1)] text-[rgba(0,242,254,0.5)] hover:text-[#00F2FE] hover:border-[rgba(0,242,254,0.3)] transition-colors"
        >
          Return Home
        </a>
      </div>
    </div>
  );
}

function ErrorFallback() {
  return (
    <div className="border border-[rgba(255,75,43,0.3)] bg-[rgba(255,75,43,0.04)] p-10 w-full max-w-md flex items-center justify-center">
      <div className="w-5 h-5 border border-[#FF4B2B] border-t-transparent animate-spin" />
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-[#0B132B] flex items-center justify-center p-8">
      <Suspense fallback={<ErrorFallback />}>
        <AuthErrorContent />
      </Suspense>
    </div>
  );
}
