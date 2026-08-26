
const NAME_PATTERN = /^[A-Za-z ]+$/

export function validateName(name) {
  const trimmed = name.trim()
  if (!trimmed) return 'Name is required.'
  if (!NAME_PATTERN.test(trimmed)) return 'Name can only contain letters and spaces — no numbers or symbols.'
  return ''
}


const HAS_DIGIT = /\d/
const HAS_SPECIAL = /[!@#$%^&*(),.?":{}|<>_\-[\]/\\'`~+=;]/

export function validatePassword(password) {
  if (password.length < 8 || password.length > 16) return 'Password must be 8–16 characters long.'
  if (!HAS_DIGIT.test(password)) return 'Password must include at least one number.'
  if (!HAS_SPECIAL.test(password)) return 'Password must include at least one special character.'
  return ''
}
