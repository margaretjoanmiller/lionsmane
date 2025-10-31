import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
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
    await authClient.updateUser({
      image: values.image,
      name: values.name,
    });
  }

  return (
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
        <Button className="pt-8" type="submit">
          Update
        </Button>
      </form>
    </Form>
  );
}
