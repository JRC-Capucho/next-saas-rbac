import react from "react"

interface FormState {
  success: boolean
  message: string | null
  errors: Record<string, string[]> | null
}

export function useFormState(
  action: (data: FormData) => Promise<FormState>,
  initialState?: FormState,
) {
  const [isPending, startTransition] = react.useTransition()

  const [formState, setFormState] = react.useState(
    initialState ?? { success: false, message: null, errors: null },
  )

  async function handleSubmit(event: react.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const form = event.currentTarget
    const data = new FormData(form)

    startTransition(async () => {
      const state = await action(data)

      setFormState(state)
    })
  }

  return [formState, handleSubmit, isPending] as const
}
