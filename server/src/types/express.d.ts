export interface AuthUser {
  uid: string;
  email?: string;
  emailVerified?: boolean;
  /** `firebase.sign_in_provider` z ID tokenu — 'password', 'google.com', … */
  provider?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      appUserId?: string;
    }
  }
}
