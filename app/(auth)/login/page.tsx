import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import React from 'react';
import { getSafeReturnToPath } from '../../../util/validation';
import LoginForm from './LoginForm';

type Props = {
  searchParams: {
    returnTo?: string | string[];
  };
};

export default function LoginPage({ searchParams }: Props) {
  // FIXME: Create secure session token and rename insecureSessionTokenCookie to sessionToken everywhere
  const insecureSessionTokenCookie = cookies().get('sessionToken');

  if (insecureSessionTokenCookie?.value) {
    redirect(getSafeReturnToPath(searchParams.returnTo) || '/');
  }
  return <LoginForm returnTo={searchParams.returnTo} />;
}
