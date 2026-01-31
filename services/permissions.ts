import { User } from '../types';

export const ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  STAFF: 'staff',
  USER: 'user',
} as const;

export const PERMISSIONS = {
  MANAGE_USERS: 'manage_users',       // Ban, Mute, Change Role
  MANAGE_CONTENT: 'manage_content',   // Edit/Delete ANY post
  FEATURE_POSTS: 'feature_posts',     // Set posts as featured
  MANAGE_CATEGORIES: 'manage_categories',
  VIEW_ADMIN_DASHBOARD: 'view_admin_dashboard',
} as const;

type Role = typeof ROLES[keyof typeof ROLES];
type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [ROLES.OWNER]: [
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.MANAGE_CONTENT,
    PERMISSIONS.FEATURE_POSTS,
    PERMISSIONS.MANAGE_CATEGORIES,
    PERMISSIONS.VIEW_ADMIN_DASHBOARD,
  ],
  [ROLES.ADMIN]: [
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.MANAGE_CONTENT,
    PERMISSIONS.FEATURE_POSTS,
    PERMISSIONS.MANAGE_CATEGORIES,
    PERMISSIONS.VIEW_ADMIN_DASHBOARD,
  ],
  [ROLES.STAFF]: [
    PERMISSIONS.MANAGE_CONTENT, // Staff can moderate content but not users/system
    PERMISSIONS.VIEW_ADMIN_DASHBOARD, // Restricted view
  ],
  [ROLES.USER]: [],
};

export const hasPermission = (user: User | null | undefined, permission: Permission): boolean => {
  if (!user) return false;
  return ROLE_PERMISSIONS[user.role]?.includes(permission) || false;
};

// Updated to require authUid for security check
export const canEditItem = (user: User | null | undefined, authUid: string | undefined, itemAuthorId: string): boolean => {
  if (!user || !authUid) return false;
  
  // Owner/Admin/Staff can edit all
  if (hasPermission(user, PERMISSIONS.MANAGE_CONTENT)) return true;

  // User can edit their own items
  return authUid === itemAuthorId;
};