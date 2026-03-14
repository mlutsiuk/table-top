import type { ZodType, z } from 'zod'
import type { FormError, FormSubmitEvent } from '#ui/types'
import type { KForm } from '#components'

export function useForm<T extends ZodType<any, any>>(options: {
  schema: T
  form: Ref<InstanceType<typeof KForm> | null>
  onSubmit: (event: FormSubmitEvent<z.infer<T>>) => void
}) {
  return {
    clear: (path?: string) => {
      if (!options.form.value)
        return console.error('Provided form is null')

      options.form.value.clear(path)
    },
    submit: () => {
      if (!options.form.value)
        return console.error('Provided form is null')

      options.form.value.submit()
    },
    setErrors: (errors: FormError[], path?: string) => {
      if (!options.form.value)
        return console.error('Provided form is null')

      options.form.value.setErrors(errors, path)
    },
    getErrors: (path?: string) => {
      if (!options.form.value)
        return console.error('Provided form is null')

      options.form.value.getErrors(path)
    },
    schema: options.schema,
    onSubmit: options.onSubmit
  }
}
