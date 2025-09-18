import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from '@tanstack/react-router';
import React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
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
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { authClient } from '@/lib/auth-client';
import FlowbiteDiscordSolid from '~icons/flowbite/discord-solid';
import FlowbiteGithubSolid from '~icons/flowbite/github-solid';

const formSchema = z.object({
  email: z.email(),
  password: z.string().min(15),
});

export function LoginForm() {
  const navigate = useNavigate({ from: '/login' });

  const [isTfa, setIsTfa] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    await authClient.signIn.email(
      {
        ...values,
      },
      {
        async onSuccess(context) {
          if (context.data.twoFactorRedirect) {
            setIsTfa(true);
          } else {
            await navigate({ to: '/dashboard' });
          }
        },
      },
    );
  }

  const twoFactorConfirmSchema = z.object({
    code: z.string().min(6).max(6),
  });
  const twoFactorConfirmForm = useForm<z.infer<typeof twoFactorConfirmSchema>>({
    resolver: zodResolver(twoFactorConfirmSchema),
    defaultValues: {
      code: '',
    },
  });

  async function onConfirmTwoFactor(
    values: z.infer<typeof twoFactorConfirmSchema>,
  ) {
    const { data, error } = await authClient.twoFactor.verifyTotp(
      {
        code: values.code,
      },
      {
        async onSuccess() {
          await navigate({ to: '/dashboard' });
        },
      },
    );
    if (error) {
      toast.error('Error verifying two-factor authentication code', {
        description: error.message,
      });
    }
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
      {isTfa && (
        <Form {...twoFactorConfirmForm}>
          <form
            onSubmit={twoFactorConfirmForm.handleSubmit(onConfirmTwoFactor)}
          >
            <FormField
              control={twoFactorConfirmForm.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>One-Time Password</FormLabel>
                  <FormControl>
                    <InputOTP maxLength={6} {...field}>
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </FormControl>
                  <FormDescription>
                    Please enter the one-time code from your authenticator app.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Verify TOTP</Button>
          </form>
        </Form>
      )}
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
