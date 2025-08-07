export type UserRole = 'User' | 'Admin';

export type AuthenticatedUser = {
  id: number;
  role: UserRole;
  tenant_id: number;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
