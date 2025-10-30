import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { authClient } from '@/lib/auth-client';

export const Route = createFileRoute('/')({
  component: App,
});

function App() {
  const session = authClient.useSession();
  const navigate = useNavigate({ from: '/' });

  if (session.data !== null) {
    navigate({ to: '/dashboard' });
  }
  return (
    <div className="text-center">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="pb-12 pt-32 md:pb-20 md:pt-40">
          <div className="pb-12 text-center md:pb-16">
            <h1>Lionsmane</h1>
            <Link to="/login">Login</Link>
            <Link to="/signup">Signup</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
