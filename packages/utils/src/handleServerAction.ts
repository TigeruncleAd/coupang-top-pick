export function throwServerAction(message?: string) {
  return { status: 'error', message: message || 'error' }
}

export function successServerAction(message?: string, data?: any) {
  return { status: 'success', message: message || 'success', data }
}
