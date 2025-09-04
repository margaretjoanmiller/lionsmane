import { createFileRoute } from '@tanstack/react-router'
<<<<<<< HEAD
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
=======
import logo from '../logo.svg'
>>>>>>> 1268f26 (Create tanstack router app)

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
<<<<<<< HEAD
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
=======
  return (
    <div className="text-center">
      <header className="min-h-screen flex flex-col items-center justify-center bg-[#282c34] text-white text-[calc(10px+2vmin)]">
        <img
          src={logo}
          className="h-[40vmin] pointer-events-none animate-[spin_20s_linear_infinite]"
          alt="logo"
        />
        <p>
          Edit <code>src/routes/index.tsx</code> and save to reload.
        </p>
        <a
          className="text-[#61dafb] hover:underline"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
        <a
          className="text-[#61dafb] hover:underline"
          href="https://tanstack.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn TanStack
        </a>
      </header>
>>>>>>> 1268f26 (Create tanstack router app)
    </div>
  )
}
