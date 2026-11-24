const ellipse = (x, y, cx, cy, rx, ry) => 1 - ((x - cx) / rx) ** 2 - ((y - cy) / ry) ** 2
const triangle = (x, y, points) => {
  const signs = points.map(([ax, ay], i) => {
    const [bx, by] = points[(i + 1) % 3]
    return (bx - ax) * (y - ay) - (by - ay) * (x - ax)
  })
  return signs.every(sign => sign >= 0) || signs.every(sign => sign <= 0)
}
const leftEar = [[106,44],[100,184],[181,135]]
const rightEar = [[291,29],[234,125],[319,171]]
const innerLeft = [[112,62],[113,147],[151,130]]
const innerRight = [[288,48],[257,124],[301,134]]
const noise = (x, y) => {
  const value = Math.sin(x * 22.87 + y * 79.13) * 43758.5453
  return value - Math.floor(value)
}
function dot(x, y) {
  const head = ellipse(x,y,209,219,115,107)
  const body = ellipse(x,y,217,435,118,169)
  const ear = triangle(x,y,leftEar) || triangle(x,y,rightEar)
  const inner = triangle(x,y,innerLeft) || triangle(x,y,innerRight)
  const eye = (cx, cy) => {
    const tilt = cx < 210 ? .23 : -.31
    return ellipse(x,y - (x - cx) * tilt,cx,cy,28,12)
  }
  const leftEye = eye(161,210)
  const rightEye = eye(258,199)
  const leftPupil = ellipse(x,y,164,210,4,11)
  const rightPupil = ellipse(x,y,259,199,4.5,12)
  const muzzle = Math.max(ellipse(x,y,191,254,27,17),ellipse(x,y,235,249,28,16),0)
  const nose = triangle(x,y,[[198,235],[224,231],[213,246]])
  const mouth = x >= 186 && x <= 239 && Math.abs(y - (258 - Math.abs(x - 214) * .13)) < 2
  const brow = Math.max(ellipse(x,y,160,192,44,18),ellipse(x,y,254,176,42,21),0)
  const edge = Math.max(0, Math.min(1, x / 145, (366 - x) / 55))
  const fur = .82 + .18 * Math.sin(x * .135 - y * .093 + 1.6 * Math.cos(x * .035))
  let light = ear ? (inner ? .34 : .58) : 0
  if (body > 0) light = Math.max(light, (.35 + .15 * Math.sin((x + y * .6) * .14)) * Math.sqrt(body) * .91)
  if (head > 0) light = Math.max(light, Math.sqrt(head) * (.43 + .31 * brow + .36 * muzzle) * fur)
  if (leftEye > 0 || rightEye > 0) light = leftPupil > 0 || rightPupil > 0 ? .04 : .72
  if (ellipse(x,y,159,206,3,2) > 0 || ellipse(x,y,257,195,3,2) > 0) light = 1
  if (nose || mouth || (Math.abs(x - 213) < 2 && y > 243 && y < 257)) light *= .14
  return light * edge * (.46 + .72 * noise(x,y))
}
const dots = new Map()
for (let row = 0; row < 113; row++) {
  const y = 4 + row * 3.6
  for (let col = 0; col < 111; col++) {
    const x = 3 + col * 3.6 + (row % 2) * 1.8
    const light = dot(x,y)
    if (light > .075 && noise(col + .5,row + .5) < light + .53) {
      const opacity = Math.max(1,Math.round(Math.min(.94,light * 1.05) * 16)) / 16
      const radius = Math.round(Math.min(1.55,.34 + light * 1.14) * 20) / 20
      const width = +(radius * 2).toFixed(2)
      const x0 = (x-radius).toFixed(2)
      const segment = 'M'+x0+' '+y.toFixed(2)+'a'+radius+' '+radius+' 0 1 0 '+width+' 0a'+radius+' '+radius+' 0 1 0 -'+width+' 0'
      dots.set(opacity,(dots.get(opacity) ?? '')+segment)
    }
  }
}
const whiskers = [
  'M185 254 Q115 227 31 240','M184 259 Q104 250 17 274','M183 265 Q106 271 46 303','M186 270 Q129 291 85 333',
  'M238 246 Q319 213 409 211','M241 252 Q321 233 412 239','M241 258 Q324 250 412 269',
  'M239 264 Q327 273 409 304','M236 269 Q307 292 389 339',
]
export default function HalftoneCat() {
  return <svg className="auth-cat" viewBox="0 0 410 410" preserveAspectRatio="xMidYMax meet" aria-hidden="true" focusable="false">
    <defs><linearGradient id="cat-whisker-light"><stop stopColor="#666" stopOpacity=".14"/><stop offset=".52" stopColor="#aaa" stopOpacity=".68"/><stop offset="1" stopColor="#aaa" stopOpacity=".3"/></linearGradient></defs>
    {[...dots].map(([opacity,path]) => <path key={opacity} d={path} opacity={opacity} fill="#ddd"/>)}
    {whiskers.map(path => <path key={path} d={path} stroke="url(#cat-whisker-light)" fill="none" strokeWidth="1.55" strokeLinecap="round" strokeDasharray=".1 3.3"/>)}
  </svg>
}