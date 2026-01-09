import { canAccess } from '@/lib/auth/access';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

const BACKEND_BASE_URL =
  process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const BACKEND_PREFIX = process.env.API_PREFIX || '/api/v1';

const ENABLE_DENIAL_AUDIT = process.env.PROXY_AUDIT_DENIALS !== '0';
const ENABLE_DENIAL_AUDIT_PERSIST = process.env.PROXY_AUDIT_PERSIST_DENIALS !== '0';
const DENIAL_AUDIT_TIMEOUT_MS = Number(process.env.PROXY_AUDIT_TIMEOUT_MS || 400);

// Only allow forwarding to known backend routes.
// This prevents the proxy from becoming a generic SSRF-style tunnel.
const ALLOWED_PATHS: RegExp[] = [
  /^health$/,
  /^passengers(\/.*)?$/,
  /^crew(\/.*)?$/,
  /^vessels(\/.*)?$/,
  /^compliance(\/.*)?$/,
  /^audit(\/.*)?$/,
];

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD';

type AccessRule = {
  path: RegExp;
  methods: Method[];
  feature?: string;
};

// Fine-grained enforcement to align with UI access expectations.
// IMPORTANT: Keep this in sync with src/lib/api/client.ts and backend routes.
const ACCESS_RULES: AccessRule[] = [
  // Health
  { path: /^health$/, methods: ['GET'] },

  // Passengers
  { path: /^passengers$/, methods: ['GET'], feature: 'passengers.view' },
  { path: /^passengers$/, methods: ['POST'], feature: 'passengers.checkin' },
  { path: /^passengers\/checkin$/, methods: ['POST'], feature: 'passengers.checkin' },
  { path: /^passengers\/sailings$/, methods: ['GET'], feature: 'passengers.view' },
  { path: /^passengers\/[^/]+$/, methods: ['GET'], feature: 'passengers.view' },
  { path: /^passengers\/[^/]+$/, methods: ['PATCH'], feature: 'passengers.checkin' },
  { path: /^passengers\/[^/]+\/check-in$/, methods: ['POST'], feature: 'passengers.checkin' },

  // Manifests
  { path: /^passengers\/manifests$/, methods: ['GET'], feature: 'passengers.view' },
  { path: /^passengers\/manifests\/[^/]+$/, methods: ['GET'], feature: 'passengers.view' },
  {
    path: /^passengers\/manifests\/generate\/[^/]+$/,
    methods: ['POST'],
    feature: 'manifests.generate',
  },
  {
    path: /^passengers\/manifests\/[^/]+\/approve$/,
    methods: ['POST'],
    feature: 'manifests.approve',
  },
  {
    path: /^passengers\/manifests\/[^/]+\/submit$/,
    methods: ['POST'],
    feature: 'manifests.submit',
  },

  // Crew
  { path: /^crew$/, methods: ['GET'], feature: 'crew.view' },
  { path: /^crew$/, methods: ['POST'], feature: 'crew.manage' },
  { path: /^crew\/[^/]+$/, methods: ['GET'], feature: 'crew.view' },
  { path: /^crew\/[^/]+$/, methods: ['PATCH'], feature: 'crew.manage' },
  { path: /^crew\/roster\/[^/]+$/, methods: ['GET'], feature: 'crew.view' },

  // Certifications
  { path: /^crew\/certifications$/, methods: ['GET'], feature: 'certifications.view' },
  { path: /^crew\/certifications$/, methods: ['POST'], feature: 'certifications.manage' },
  { path: /^crew\/certifications\/[^/]+$/, methods: ['GET'], feature: 'certifications.view' },
  {
    path: /^crew\/certifications\/[^/]+\/verify$/,
    methods: ['POST'],
    feature: 'certifications.manage',
  },

  // Vessels
  { path: /^vessels$/, methods: ['GET'], feature: 'vessels.view' },
  { path: /^vessels$/, methods: ['POST'], feature: 'vessels.manage' },
  { path: /^vessels\/[^/]+$/, methods: ['GET'], feature: 'vessels.view' },
  { path: /^vessels\/[^/]+$/, methods: ['PATCH'], feature: 'vessels.manage' },
  { path: /^vessels\/[^/]+\/documents$/, methods: ['GET'], feature: 'vessels.view' },
  { path: /^vessels\/[^/]+\/documents$/, methods: ['POST'], feature: 'documents.upload' },

  // Compliance
  { path: /^compliance\/dashboard$/, methods: ['GET'], feature: 'compliance.dashboard' },
  { path: /^compliance\/jurisdictions$/, methods: ['GET'], feature: 'compliance.dashboard' },
  {
    path: /^compliance\/export\/[^/]+\/[^/]+\/[^/]+$/,
    methods: ['GET'],
    feature: 'compliance.export',
  },

  // Inspections
  { path: /^compliance\/inspections$/, methods: ['GET'], feature: 'inspections.manage' },
  { path: /^compliance\/inspections$/, methods: ['POST'], feature: 'inspections.manage' },
  { path: /^compliance\/inspections\/[^/]+$/, methods: ['PATCH'], feature: 'inspections.manage' },

  // Audit
  { path: /^audit$/, methods: ['GET'], feature: 'audit.view' },
];

function isAllowedPath(pathParts: string[]) {
  const joined = pathParts.join('/');
  return ALLOWED_PATHS.some((re) => re.test(joined));
}

function getClientIp(req: NextRequest): string | undefined {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }

  const realIp = req.headers.get('x-real-ip')?.trim();
  if (realIp) return realIp;

  return undefined;
}

function auditProxyDenial(args: {
  req: NextRequest;
  status: 401 | 403 | 404 | 405;
  reason:
    | 'PATH_NOT_ALLOWED'
    | 'NO_ACCESS_TOKEN'
    | 'NO_ACCESS_RULE'
    | 'METHOD_NOT_ALLOWED'
    | 'FEATURE_FORBIDDEN';
  path: string;
  method: string;
  feature?: string;
  allowedMethods?: string[];
  roles?: string[];
  subject?: string;
  accessToken?: string;
}) {
  const shouldLog = ENABLE_DENIAL_AUDIT;
  const shouldPersist = ENABLE_DENIAL_AUDIT_PERSIST && !!args.accessToken;

  if (!shouldLog && !shouldPersist) return;

  // IMPORTANT: never log bearer tokens or cookies.
  const ip = getClientIp(args.req);
  const userAgent = args.req.headers.get('user-agent') || undefined;

  const payload = {
    ts: new Date().toISOString(),
    status: args.status,
    reason: args.reason,
    method: args.method,
    path: args.path,
    feature: args.feature,
    allowedMethods: args.allowedMethods,
    subject: args.subject,
    roles: args.roles,
    ip,
    userAgent,
  };

  if (shouldLog) {
    // IMPORTANT: never log bearer tokens or cookies.
    console.warn('[proxy-denied]', payload);
  }

  if (shouldPersist) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DENIAL_AUDIT_TIMEOUT_MS);

    try {
      const prefix = BACKEND_PREFIX.endsWith('/') ? BACKEND_PREFIX.slice(0, -1) : BACKEND_PREFIX;
      const url = new URL(`${prefix}/audit`, BACKEND_BASE_URL);

      const headers = new Headers();
      headers.set('content-type', 'application/json');
      headers.set('authorization', `Bearer ${args.accessToken}`);
      if (ip) headers.set('x-forwarded-for', ip);
      if (userAgent) headers.set('user-agent', userAgent);

      // Best-effort write; do not block user flow if audit persistence fails.
      void fetch(url.toString(), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          entityType: 'proxy',
          entityId: args.path,
          entityName: 'web-bff',
          action: 'READ',
          actionDescription: 'BFF proxy denied request',
          details: {
            ...payload,
          },
          reason: args.reason,
        }),
        signal: controller.signal,
      }).catch(() => {
        // swallow
      });
    } finally {
      clearTimeout(timeout);
    }
  }
}

function buildBackendUrl(req: NextRequest, pathParts: string[]) {
  const prefix = BACKEND_PREFIX.endsWith('/') ? BACKEND_PREFIX.slice(0, -1) : BACKEND_PREFIX;
  const path = pathParts.map(encodeURIComponent).join('/');
  const url = new URL(`${prefix}/${path}`, BACKEND_BASE_URL);
  url.search = req.nextUrl.search;
  return url;
}

function filterRequestHeaders(headers: Headers) {
  const result = new Headers();

  headers.forEach((value, key) => {
    const lower = key.toLowerCase();

    // Hop-by-hop and unsafe headers
    if (
      lower === 'host' ||
      lower === 'connection' ||
      lower === 'content-length' ||
      lower === 'accept-encoding' ||
      lower === 'origin' ||
      lower === 'referer'
    ) {
      return;
    }

    // Cookies are for this Next app; backend auth is via bearer token
    if (lower === 'cookie') {
      return;
    }

    result.set(key, value);
  });

  return result;
}

async function jsonErrorFromUpstream(upstream: Response) {
  const contentType = upstream.headers.get('content-type') || '';
  const status = upstream.status;

  try {
    if (contentType.includes('application/json')) {
      const data = await upstream.json();
      const message = (data?.message as string) || (data?.error as string) || 'Upstream error';
      return Response.json(
        {
          error: message,
          status,
          upstream: data,
        },
        { status }
      );
    }

    const text = await upstream.text();
    return Response.json(
      {
        error: text || 'Upstream error',
        status,
      },
      { status }
    );
  } catch {
    return Response.json(
      {
        error: 'Upstream error',
        status,
      },
      { status }
    );
  }
}

async function handler(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;

  const joinedPath = path.join('/');
  const method = req.method.toUpperCase() as Method;

  if (!isAllowedPath(path)) {
    auditProxyDenial({
      req,
      status: 404,
      reason: 'PATH_NOT_ALLOWED',
      method,
      path: joinedPath,
    });
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token?.accessToken) {
    auditProxyDenial({
      req,
      status: 401,
      reason: 'NO_ACCESS_TOKEN',
      method,
      path: joinedPath,
      subject: (token as any)?.sub,
    });
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const roles = (token.roles as string[]) || [];
  const subject = (token as any)?.sub as string | undefined;

  const matchingRules = ACCESS_RULES.filter((r) => r.path.test(joinedPath));
  if (matchingRules.length === 0) {
    auditProxyDenial({
      req,
      status: 404,
      reason: 'NO_ACCESS_RULE',
      method,
      path: joinedPath,
      roles,
      subject,
      accessToken: token.accessToken as string,
    });
    return Response.json({ error: 'Not found', status: 404 }, { status: 404 });
  }

  const allowedMethods = new Set<Method>();
  for (const r of matchingRules) {
    r.methods.forEach((m) => allowedMethods.add(m));
  }

  if (!allowedMethods.has(method)) {
    auditProxyDenial({
      req,
      status: 405,
      reason: 'METHOD_NOT_ALLOWED',
      method,
      path: joinedPath,
      roles,
      subject,
      allowedMethods: Array.from(allowedMethods),
      accessToken: token.accessToken as string,
    });
    return Response.json(
      { error: 'Method not allowed', status: 405, allowed: Array.from(allowedMethods) },
      { status: 405, headers: { Allow: Array.from(allowedMethods).join(', ') } }
    );
  }

  const ruleForMethod = matchingRules.find((r) => r.methods.includes(method));
  if (ruleForMethod?.feature && !canAccess(roles, ruleForMethod.feature)) {
    auditProxyDenial({
      req,
      status: 403,
      reason: 'FEATURE_FORBIDDEN',
      method,
      path: joinedPath,
      feature: ruleForMethod.feature,
      roles,
      subject,
      accessToken: token.accessToken as string,
    });
    return Response.json(
      { error: 'Forbidden', status: 403, feature: ruleForMethod.feature },
      { status: 403 }
    );
  }

  const backendUrl = buildBackendUrl(req, path);
  const headers = filterRequestHeaders(req.headers);
  headers.set('Authorization', `Bearer ${token.accessToken}`);

  let body: ArrayBuffer | undefined;
  if (!['GET', 'HEAD'].includes(method)) {
    body = await req.arrayBuffer();
  }

  const upstream = await fetch(backendUrl.toString(), {
    method,
    headers,
    body,
    redirect: 'manual',
  });

  if (!upstream.ok) {
    return jsonErrorFromUpstream(upstream);
  }

  const responseHeaders = new Headers(upstream.headers);
  // Avoid issues with compressed responses
  responseHeaders.delete('content-encoding');
  responseHeaders.delete('content-length');
  // Never forward cookies from upstream through this proxy.
  responseHeaders.delete('set-cookie');

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

export { handler as DELETE, handler as GET, handler as PATCH, handler as POST, handler as PUT };
