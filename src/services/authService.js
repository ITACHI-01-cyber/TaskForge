async function request(body) {
  const response = await fetch('/api/auth', {
    cache:'no-store',
    ...(body && {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)}),
  })
  const result = await response.json().catch(() => null)
  if (!response.ok || !result) throw new Error(result?.error ?? 'Unable to reach TaskForge. Try again.')
  return result.user
}
export const authService = {
  session: () => request(),
  submit: (action, fields) => request({...fields, action}),
  logout: () => request({action:'logout'}),
}