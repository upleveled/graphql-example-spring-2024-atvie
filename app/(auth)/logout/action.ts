'use server';

import { cookies } from 'next/headers';

export async function logout() {
  // FIXME: Create secure session token and rename insecureSessionTokenCookie to sessionToken everywhere
  const insecureSessionTokenCookie = cookies().get('sessionToken');

  if (!insecureSessionTokenCookie) return undefined;
  // FIXME: Delete the session from the database

  // Delete the session cookie from the browser
  await cookies().set('sessionToken', '', { maxAge: -1 });
}
