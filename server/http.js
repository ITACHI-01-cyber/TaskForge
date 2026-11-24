export function json(res, status, body) {
  res.setHeader('Cache-Control', 'private, no-store')
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.statusCode = status
  res.end(JSON.stringify(body))
}

export async function readJson(req, maxBytes) {
  const type = req.headers['content-type'] ?? ''
  const site = req.headers['sec-fetch-site']
  const origin = req.headers.origin
  const scheme = process.env.VERCEL || req.socket?.encrypted ? 'https' : 'http'
  const sameOrigin = !origin || origin === scheme + '://' + req.headers.host
  if (!sameOrigin || (site && !['same-origin','none'].includes(site)) || !/^application\/json(?:\s*;|$)/i.test(type)) {
    throw Object.assign(new Error('Same-origin JSON requests are required.'), {status:415})
  }
  const tooLarge = () => Object.assign(new Error('Request is too large.'), {status:413})
  if (req.body !== undefined) {
    let raw
    try { raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body) }
    catch { throw new SyntaxError('Invalid request body') }
    if (Buffer.byteLength(raw) > maxBytes) throw tooLarge()
    return parse(raw)
  }
  const chunks = []
  let bytes = 0
  for await (const chunk of req) {
    bytes += chunk.length
    if (bytes > maxBytes) throw tooLarge()
    chunks.push(chunk)
  }
  return parse(Buffer.concat(chunks).toString('utf8'))
}

function parse(raw) {
  const payload = JSON.parse(raw)
  function check(value, depth) {
    if (depth > 20) throw new SyntaxError('Invalid request depth')
    if (!value || typeof value !== 'object') return
    for (const key of Object.keys(value)) {
      if (['__proto__','constructor','prototype'].includes(key) || key.startsWith('$') || key.includes('.')) {
        throw new SyntaxError('Unsupported property name')
      }
      check(value[key], depth + 1)
    }
  }
  check(payload,0)
  return payload
}