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
      /**
       * Trvalý súhlas s AI/OCR spracovaním zdravotných dokumentov, načítaný
       * z DB v `ensureUser`. Zdroj pravdy pre privacyGuard — nikdy neber
       * súhlas z tela requestu, klient si ho nesmie určovať sám.
       */
      aiConsentGranted?: boolean;
    }
  }
}
