import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getValidSession } from '../../../database/sessions';
import AnimalsForm from './AnimalsForm';

export default async function Dashboard() {
  // Task: Protect the dashboard page and redirect to login if the user is not logged in

  // 1. Checking if the sessionToken cookie exists
  const sessionCookie = cookies().get('sessionToken');
  // 2. Check if the sessionToken cookie is still valid
  const session = sessionCookie && (await getValidSession(sessionCookie.value));
  // 3. If the sessionToken cookie is invalid or doesn't exist, redirect to login with returnTo

  if (!session) {
    redirect('/login?returnTo=/animals/dashboard');
  }

  // 4. If the sessionToken cookie is valid, allow access to dashboard page
  return (
    <div>
      <AnimalsForm />
    </div>
  );
}
