import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { authClient } from '@/lib/auth-client';
import { Button } from './ui/button';
import { FieldGroup } from './ui/field';
import { Form, FormControl, FormField, FormItem, FormLabel } from './ui/form';
import { Input } from './ui/input';

const updateUserSchema = z.object({
  image: z.url().optional(),
  name: z.string().min(2).max(100).optional(),
});

const updatePasswordSchema = z
  .object({
    confirm: z.string().min(8).max(128),
    oldPassword: z.string().min(8).max(128),
    password: z.string().min(8).max(128),
  })
  .refine((val) => val.password === val.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  });

export default function UpdateUser() {
  const updateUserForm = useForm<z.infer<typeof updateUserSchema>>({
    defaultValues: {
      image: undefined,
      name: undefined,
    },
    resolver: zodResolver(updateUserSchema),
  });

  async function onUserUpdate(values: z.infer<typeof updateUserSchema>) {
    const { data, error } = await authClient.updateUser({
      image: values.image,
      name: values.name,
    });

    if (error) {
      toast.error('Error updating user info', {
        description: error.message,
      });
    } else if (data) {
      toast.success('Succesfully updated user info');
    }
  }

  async function onPasswordUpdate(
    values: z.infer<typeof updatePasswordSchema>,
  ) {
    const { data, error } = await authClient.changePassword({
      currentPassword: values.oldPassword,
      newPassword: values.password,
      revokeOtherSessions: true,
    });
    if (error) {
      toast.error('Error updating password', {
        description: error.message,
      });
    } else if (data) {
      toast.success('Succesfully updated password');
    }
  }

  const updatePasswordForm = useForm<z.infer<typeof updatePasswordSchema>>({
    defaultValues: {
      confirm: '',
      oldPassword: '',
      password: '',
    },
    resolver: zodResolver(updatePasswordSchema),
  });

  return (
    <>
      <Form {...updateUserForm}>
        <form onSubmit={updateUserForm.handleSubmit(onUserUpdate)}>
          <FieldGroup>
            <FormField
              control={updateUserForm.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image?</FormLabel>
                  <FormControl>
                    <Input placeholder="Image URL" type="url" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={updateUserForm.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name?</FormLabel>
                  <FormControl>
                    <Input placeholder="Marty" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </FieldGroup>
          <Button className="my-8" type="submit">
            Update
          </Button>
        </form>
      </Form>
      <Form {...updatePasswordForm}>
        <form onSubmit={updatePasswordForm.handleSubmit(onPasswordUpdate)}>
          <FieldGroup>
            <FormField
              control={updatePasswordForm.control}
              name="oldPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Old password</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="old password"
                      type="password"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={updatePasswordForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New password</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="new password"
                      type="password"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={updatePasswordForm.control}
              name="confirm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm password</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="confirm new password"
                      type="password"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </FieldGroup>
          <Button className="mt-8" type="submit">
            Update
          </Button>
        </form>
      </Form>
    </>
  );
}
