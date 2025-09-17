import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { authClient } from '@/lib/auth-client';
import FlowbiteDiscordSolid from '~icons/flowbite/discord-solid';
import FlowbiteGithubSolid from '~icons/flowbite/github-solid';

const formSchema = z.object({
  email: z.email(),
  password: z.string().min(15),
});

export function LoginForm() {
  const navigate = useNavigate({ from: '/login' });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    await authClient.signIn.email({
      ...values,
    });

    await navigate({ to: '/dashboard' });
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="shadcn" {...field} />
                </FormControl>
                <FormDescription>
                  This is your account email address.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="shadcn" {...field} />
                </FormControl>
                <FormDescription>This is your password.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit">Submit</Button>
        </form>
      </Form>
      <div className="flex flex-col gap-4">
        <Button asChild>
          <Link to="/signup">Register</Link>
        </Button>
        <Button
          onClick={async () => {
            await authClient.signIn.social({
              provider: 'discord',
              callbackURL: '/callback',
            });
          }}
        >
          Sign in with Discord <FlowbiteDiscordSolid />
        </Button>
        <Button
          onClick={async () => {
            await authClient.signIn.social({
              provider: 'github',
              callbackURL: '/callback',
            });
          }}
        >
          Sign in with GitHub <FlowbiteGithubSolid />
        </Button>
      </div>
    </>
  );
}
