/** Shared between the client form and the server action. Kept in its own
 *  module so the client bundle never pulls in better-sqlite3 via db.ts. */
export const MAX_AUTHOR = 60;
export const MAX_BODY = 600;
/** Seconds one visitor must wait between guestbook messages. */
export const RATE_WINDOW = 45;
