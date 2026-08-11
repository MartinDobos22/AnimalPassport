const NOTICE_KEY = 'granule-check-inactivity-logout';

// Odhlásenie prebehne cez AuthContext, takže redirect na /login robí
// ProtectedRoute a nemáme kam odovzdať router state. Jednorazový príznak
// v sessionStorage prežije redirect a LoginPage ho spotrebuje.
export function markInactivityLogout(): void {
  try {
    window.sessionStorage.setItem(NOTICE_KEY, '1');
  } catch {
    /* sessionStorage môže byť nedostupné (private mode) — notifikácia nie je kritická */
  }
}

export function consumeInactivityLogout(): boolean {
  try {
    if (window.sessionStorage.getItem(NOTICE_KEY) !== '1') return false;
    window.sessionStorage.removeItem(NOTICE_KEY);
    return true;
  } catch {
    return false;
  }
}
