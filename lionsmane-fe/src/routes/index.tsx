import { createFileRoute } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { z } from 'zod'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAppForm } from '@/hooks/form'
import { authClient } from '@/lib/auth-client'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  const form = useAppForm({
    defaultValues: {
      email: '',
      password: '',
    },
    validators: {
      // Pass a schema or function to validate
      onChange: z.object({
        email: z.string().email(),
        password: z.string().min(13),
      }),
    },
    onSubmit: async ({ value }) => {
      // Do something with form data
      await authClient.signIn.email(value)
    },
  })

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className={cn('flex flex-col gap-6')}>
          <Card>
            <CardHeader>
              <CardTitle>Login to your account</CardTitle>
              <CardDescription>
                Enter your email below to login to your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  form.handleSubmit(e)
                }}
              >
                <div className="flex flex-col gap-6">
                  <div className="grid gap-3">
                    <form.AppField
                      name="email"
                      children={(field) => (
                        <field.Input
                          type="email"
                          placeholder="email"
                          name="email"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                      )}
                    />
                  </div>
                  <div className="grid gap-3">
                    <form.AppField
                      name="password"
                      children={(field) => (
                        <field.Input
                          type="password"
                          placeholder="password"
                          name="password"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                      )}
                    />
                  </div>
                  <div className="flex flex-col gap-3">
                    <form.AppForm>
                      <form.Button type="submit" />
                    </form.AppForm>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
