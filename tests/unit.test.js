import assert from 'node:assert/strict'
import { scryptSync } from 'node:crypto'
import { test } from 'node:test'
import { monthDays, shift, today, weekDays, validDate } from '../src/utils/dateUtils.js'
import { nextStatus, scheduled, statusOn, goalProgress } from '../src/utils/statusUtils.js'
import { countStatuses, streakStats, summarize, yearDays } from '../src/utils/analyticsUtils.js'
import { validate } from '../src/services/storageService.js'
import { workspaceCsv } from '../src/utils/dataExport.js'
import { accountKey, gmailPattern, normalizeEmail } from '../src/utils/authValidation.js'
import { createPassword, verifyPassword } from '../server/password.js'
import { readJson } from '../server/http.js'

const task = {id:'task',kind:'task',title:'Write',body:'',date:'2024-02-29',status:'PENDING',records:{}}

test('three-state cycle and independent date keys', () => {
  const tracked = {...task,records:{'2024-02-29':nextStatus('PENDING')}}
  assert.equal(statusOn(tracked,'2024-02-29'),'DONE')
  assert.equal(statusOn(tracked,'2024-03-01'),'PENDING')
  assert.equal(nextStatus('DONE'),'MISSED')
  assert.equal(nextStatus('MISSED'),'PENDING')
})
test('calendar ranges include leap days and Monday through Sunday', () => {
  assert.equal(monthDays('2024-02-10').length,29)
  assert.equal(monthDays('2025-02-10').length,28)
  assert.equal(yearDays('2024-02-10').length,366)
  assert.deepEqual([weekDays('2024-02-29')[0],weekDays('2024-02-29').at(-1)],['2024-02-26','2024-03-03'])
  assert(!validDate('2025-02-29'))
})
test('recurrence respects custom days and preserves previously recorded history', () => {
  const custom = {...task,frequency:'Custom',weekdays:[1],endDate:'2024-03-10',records:{'2024-02-29':'MISSED'}}
  assert(scheduled(custom,'2024-02-29'))
  assert(scheduled(custom,'2024-03-04'))
  assert(!scheduled(custom,'2024-03-05'))
  assert(!scheduled(custom,'2024-03-11'))
  assert(scheduled({...task,frequency:'Monthly'},'2024-03-29'))
  assert(!scheduled({...task,frequency:'Monthly'},'2024-03-28'))
})
test('fixed analytics fixture separates pending and missed without division by zero', () => {
  assert.deepEqual(countStatuses([]),{done:0,missed:0,pending:0,total:0,rate:0})
  const fixture = {...task,frequency:'Daily',records:{'2024-02-29':'DONE','2024-03-01':'MISSED'}}
  const result = summarize([fixture],['2024-02-29','2024-03-01','2024-03-02'])
  assert.deepEqual(result,{done:1,missed:1,pending:1,total:3,rate:33})
  const current = today()
  const pending = summarize([{...task,date:current,frequency:'Daily',records:{[current]:'DONE'}}],[current,shift(current,1)])
  assert.deepEqual(pending,{done:1,missed:0,pending:1,total:2,rate:100})
})
test('habit streak skips unscheduled days and resets on a missed occurrence', () => {
  const habit = {...task,kind:'habit',date:'2024-03-01',frequency:'Custom',weekdays:[1,5],records:{'2024-03-01':'DONE','2024-03-04':'DONE','2024-03-08':'MISSED','2024-03-11':'DONE'}}
  assert.deepEqual(streakStats([habit],'2024-03-11'),{current:1,longest:2})
})
test('goal progress is derived from milestones', () => {
  assert.equal(goalProgress({milestones:[{done:true},{done:false}]}),50)
  assert.equal(goalProgress({status:'DONE'}),100)
})
test('workspace validation accepts existing records and rejects duplicate or invalid statuses', () => {
  assert.equal(validate({version:1,items:[task]}).items.length,1)
  assert.throws(() => validate({version:1,items:[task,task]}))
  assert.throws(() => validate({version:1,items:[{...task,records:{'2024-02-29':true}}]}))
})
test('CSV export neutralizes spreadsheet formulas and keeps dated records', () => {
  const result = workspaceCsv([{...task,title:'=1+1',records:{'2024-02-29':'DONE'}}])
  assert.match(result,/"'=1\+1"/)
  assert.match(result,/"2024-02-29","DONE"/)
})
test('Gmail validation and duplicate normalization are consistent', () => {
  const email = normalizeEmail(' Task.Forge@GMAIL.com ')
  assert(gmailPattern.test(email))
  assert.equal(accountKey(email),'taskforge@gmail.com')
  assert(!gmailPattern.test('task@example.test'))
})
test('versioned password hashing verifies current and legacy users', async () => {
  const password = 'only-a-test-password'
  const user = await createPassword(password)
  assert.equal(user.passwordVersion,2)
  assert.notEqual(user.passwordHash,password)
  assert(await verifyPassword(password,user))
  assert(!(await verifyPassword('incorrect-password',user)))
  const salt = 'legacy-fixture'
  const legacy = {salt,passwordHash:scryptSync(password,salt,64).toString('hex')}
  assert(await verifyPassword(password,legacy))
})
test('JSON request handling enforces origin, content type, and size', async () => {
  const request = {headers:{'content-type':'application/json','host':'localhost:5173','origin':'http://localhost:5173'},body:{name:'TaskForge'}}
  assert.deepEqual(await readJson(request,100),request.body)
  await assert.rejects(readJson({...request,headers:{...request.headers,origin:'http://localhost:5174'}},100),{status:415})
  await assert.rejects(readJson({...request,headers:{...request.headers,'sec-fetch-site':'same-site'}},100),{status:415})
  await assert.rejects(readJson(request,1),{status:413})
  let deeplyNested = {}
  for (let depth=0;depth<22;depth++) deeplyNested = {entry:deeplyNested}
  await assert.rejects(readJson({...request,body:deeplyNested},1000),SyntaxError)
})