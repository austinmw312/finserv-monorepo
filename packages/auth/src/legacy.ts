/**
 * @deprecated This provider was used before we migrated to JWT-based auth.
 * It should be removed but is still referenced in some integration tests.
 * See: https://github.com/finserv/monorepo/issues/142
 */
export class LegacyAuthProvider {
  private sessions: Map<string, { userId: string; expiresAt: number }>;

  constructor() {
    this.sessions = new Map();
  }

  createSession(userId: string): string {
    const sessionId = Math.random().toString(36).substring(2);
    this.sessions.set(sessionId, {
      userId,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    });
    return sessionId;
  }

  validateSession(sessionId: string): string | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    if (session.expiresAt < Date.now()) {
      this.sessions.delete(sessionId);
      return null;
    }
    return session.userId;
  }

  destroySession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  clearExpired(): void {
    const now = Date.now();
    for (const [id, session] of this.sessions.entries()) {
      if (session.expiresAt < now) {
        this.sessions.delete(id);
      }
    }
  }
}
