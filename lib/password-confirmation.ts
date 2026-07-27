export function hasMatchingPasswordConfirmation(
  password: string,
  confirmation: string,
  minimumLength = 12
) {
  return (
    password.length >= minimumLength &&
    confirmation.length >= minimumLength &&
    password === confirmation
  )
}
