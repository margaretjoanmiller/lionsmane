import { createFormHook } from '@tanstack/react-form'

import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { fieldContext, formContext } from './form-context'

export const { useAppForm } = createFormHook({
  fieldComponents: {
    Input,
    Select,
  },
  formComponents: {
    Button,
  },
  fieldContext,
  formContext,
})
