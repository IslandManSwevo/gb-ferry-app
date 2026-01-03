'use client';

import { useSession } from 'next-auth/react';
import { canAccess, FEATURE_ACCESS, ROLES, type Role } from './access';

export { canAccess, FEATURE_ACCESS, ROLES };
export type { Role };

/**
 * Hook to check if the current user has a specific role
 */
export function useHasRole(role: Role | Role[]): boolean {
  const { data: session } = useSession();
  
  if (!session?.user?.roles) {
    return false;
  }

  const requiredRoles = Array.isArray(role) ? role : [role];
  return requiredRoles.some((r) => session.user.roles.includes(r));
}

/**
 * Hook to get all roles for the current user
 */
export function useUserRoles(): Role[] {
  const { data: session } = useSession();
  return (session?.user?.roles as Role[]) || [];
}

/**
 * Hook to check if user can access a feature
 */
export function useCanAccess(feature: string): boolean {
  const roles = useUserRoles();
  return canAccess(roles, feature);
}
