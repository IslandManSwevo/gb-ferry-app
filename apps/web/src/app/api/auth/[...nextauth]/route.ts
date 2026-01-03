import NextAuth, { NextAuthOptions } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import KeycloakProvider from 'next-auth/providers/keycloak';

/**
 * Refresh the Keycloak access token
 */
async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    const url = `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.KEYCLOAK_CLIENT_ID!,
        client_secret: process.env.KEYCLOAK_CLIENT_SECRET || '',
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken as string,
      }),
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
    };
  } catch (error) {
    console.error('Error refreshing access token:', error);
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
}

// Test OIDC discovery at startup
const oidcUrl = `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/.well-known/openid-configuration`;
fetch(oidcUrl)
  .then((res) => res.json())
  .then((config) => {
    console.log('[NextAuth] OIDC Discovery successful:', {
      issuer: config.issuer,
      authorization_endpoint: config.authorization_endpoint,
      token_endpoint: config.token_endpoint,
    });
  })
  .catch((err) => {
    console.error('[NextAuth] OIDC Discovery FAILED:', err.message);
  });

// Log provider configuration at startup
console.log('[NextAuth] Keycloak provider configuration:', {
  issuer: `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}`,
  clientId: process.env.KEYCLOAK_CLIENT_ID,
  hasSecret: !!process.env.KEYCLOAK_CLIENT_SECRET,
});

const authOptions: NextAuthOptions = {
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
  logger: {
    error(code, metadata) {
      console.error('[NextAuth][Error]', code, metadata);
    },
    warn(code) {
      console.warn('[NextAuth][Warn]', code);
    },
    debug(code, metadata) {
      console.log('[NextAuth][Debug]', code, metadata);
    },
  },
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET || '',
      issuer: `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}`,
      // Explicit wellKnown URL for OIDC discovery
      wellKnown: `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/.well-known/openid-configuration`,
      authorization: {
        params: {
          scope: 'openid email profile',
        },
      },
    }),
  ],

  callbacks: {
    async jwt({ token, account, user }) {
      // Initial sign in
      if (account && user) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: account.expires_at ? account.expires_at * 1000 : 0,
          roles: (account as any).roles || [],
          userId: user.id,
        };
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < (token.accessTokenExpires as number)) {
        return token;
      }

      // Access token has expired, try to refresh it
      return refreshAccessToken(token);
    },

    async session({ session, token }) {
      // Send properties to the client
      session.accessToken = token.accessToken as string;
      session.error = token.error as string | undefined;
      session.user = {
        ...session.user,
        id: token.userId as string,
        roles: token.roles as string[],
      };

      return session;
    },

    async redirect({ url, baseUrl }) {
      // Allow relative redirects
      if (url.startsWith('/')) return `${baseUrl}${url}`;

      try {
        const target = new URL(url);
        const base = new URL(baseUrl);

        // Allow same-origin redirects
        if (target.origin === base.origin) return url;

        // Allow Keycloak OAuth redirects (authorization endpoint)
        const keycloakUrl = process.env.KEYCLOAK_URL;
        if (keycloakUrl && url.startsWith(keycloakUrl)) return url;
      } catch {
        // ignore invalid URLs
      }

      return baseUrl;
    },
  },

  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },

  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },

  events: {
    async signOut({ token }) {
      // Logout from Keycloak as well
      if (token.refreshToken) {
        try {
          const url = `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/logout`;
          await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              client_id: process.env.KEYCLOAK_CLIENT_ID!,
              client_secret: process.env.KEYCLOAK_CLIENT_SECRET || '',
              refresh_token: token.refreshToken as string,
            }),
          });
        } catch (error) {
          console.error('Error logging out from Keycloak:', error);
        }
      }
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
