export const gmailPattern = /^[a-z0-9]+(?:\.[a-z0-9]+)*@gmail\.com$/i
export const normalizeEmail = email => email.trim().toLowerCase()
export const accountKey = email => email.split('@')[0].replaceAll('.', '') + '@gmail.com'
export const validPassword = password => typeof password === 'string' && password.length >= 8 && password.length <= 128