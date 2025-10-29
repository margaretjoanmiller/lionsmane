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
    defaultValues: {
      email: '',
      password: '',
    },
    resolver: zodResolver(formSchema),
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    await authClient.signIn.email(
      {
        ...values,
      },
      {
        onError() {
          toast.error('Error signing in');
        },
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
    defaultValues: {
      code: '',
    },
    resolver: zodResolver(twoFactorConfirmSchema),
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
    if (error || !data) {
      toast.error('Error verifying two-factor authentication code', {
        description: error.message,
      });
    }
  }

  const backupCodeSchema = z.object({
    code: z.string(),
  });

  const backupCodeForm = useForm<z.infer<typeof backupCodeSchema>>({
    defaultValues: {
      code: '',
    },
    resolver: zodResolver(backupCodeSchema),
  });

  async function onUseBackupCode(values: z.infer<typeof backupCodeSchema>) {
    const { data, error } = await authClient.twoFactor.verifyBackupCode(
      {
        code: values.code,
      },
      {
        async onSuccess() {
          await navigate({ to: '/dashboard' });
        },
      },
    );
    if (error || !data) {
      toast.error('Error verifying two-factor authentication code', {
        description: error.message,
      });
    }
  }

  return (
    <>
      <Form {...form}>
        <form
          className="space-y-8 flex flex-col"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="doc.brown@mit.edu"
                    type="email"
                    {...field}
                  />
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
                  <Input
                    placeholder="supersecretpassword"
                    type="password"
                    {...field}
                  />
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
        <>
          <Form {...twoFactorConfirmForm}>
            <form
              className="space-y-4 mt-8"
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
                      Please enter the one-time code from your authenticator
                      app.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Verify TOTP</Button>
            </form>
          </Form>
          <Form {...backupCodeForm}>
            <form
              className="space-y-4 mt-8"
              onSubmit={backupCodeForm.handleSubmit(onUseBackupCode)}
            >
              <FormField
                control={backupCodeForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Backup code</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="backup code" />
                    </FormControl>
                  </FormItem>
                )}
              />
            </form>
            <Button className="mt-4" type="submit">
              Use backup code
            </Button>
          </Form>
        </>
      )}
      <hr className="h-px my-8" />
      <div className="flex flex-col gap-4">
        <Button asChild>
          <Link to="/signup">Register</Link>
        </Button>
        <Button
          onClick={async () => {
            await authClient.signIn.social({
              callbackURL: '/callback',
              provider: 'discord',
            });
          }}
        >
          Sign in with Discord <FlowbiteDiscordSolid />
        </Button>
        <Button
          onClick={async () => {
            await authClient.signIn.social({
              callbackURL: '/callback',
              provider: 'github',
            });
          }}
        >
          Sign in with GitHub <FlowbiteGithubSolid />
        </Button>
      </div>
    </>
  );
}
