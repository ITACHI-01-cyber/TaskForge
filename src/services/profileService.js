async function request(resource, method = 'GET', fields) {
  const response = await fetch('/api/user/' + resource,{method,cache:'no-store',
    ...(fields && {headers:{'Content-Type':'application/json'},body:JSON.stringify(fields)})})
  const result = await response.json().catch(() => null)
  if (!response.ok || !result?.user) throw new Error(result?.error ?? 'Unable to update your profile.')
  return result.user
}
export const profileService = {
  get: () => request('profile'),
  update: fields => request('profile','PATCH',fields),
  upload: image => request('avatar','POST',{image}),
  remove: () => request('avatar','DELETE',{}),
}