import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { authClient } from '@/lib/auth-client';
import { Button } from './ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel } from './ui/form';
import { Input } from './ui/input';

const updateUserSchema = z.object({
  image: z.url().optional(),
  name: z.string().min(2).max(100).optional(),
});

const updatePasswordSchema = z
  .object({
    password: z.string().min(8).max(128),
    confirm: z.string().min(8).max(128),
  })
  .refine((val) => val.password === val.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  });

export default function UpdateUser() {
  const updateUserForm = useForm<z.infer<typeof updateUserSchema>>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      image: null,
      name: undefined,
    },
  });

  async function onUserUpdate(values: z.infer<typeof updateUserSchema>) {
    await authClient.updateUser({
      image: values.image,
      name: values.name,
    });
  }

  return (
    <Form {...updateUserForm}>
      <form
        onSubmit={updateUserForm.handleSubmit(onUserUpdate)}
        className="space-y-8"
      >
        <FormField
          control={updateUserForm.control}
          name="image"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Image?</FormLabel>
              <FormControl>
                <Input type="url" placeholder="Image URL" {...field} />
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
        <Button type="submit">Update</Button>
      </form>
    </Form>
  );
}
