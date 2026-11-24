import assert from 'node:assert/strict'
import {createServer} from 'node:http'
import {randomUUID} from 'node:crypto'
import {readFile} from 'node:fs/promises'
import {chromium} from 'playwright'
import {createHash} from 'node:crypto'
import sharp from 'sharp'
import auth from '../api/auth.js'
import workspace from '../api/workspace.js'
import profile from '../api/user/profile.js'
import avatar from '../api/user/avatar.js'
import {database} from '../server/mongodb.js'
import {startSession,readSession,endSession} from '../server/session.js'
import {today,shift,monthDays,weekDays} from '../src/utils/dateUtils.js'
const headers = JSON.parse(await readFile('vercel.json','utf8')).headers[0].headers
const runId=randomUUID().replaceAll('-','')
const qa='tfqa'+runId
const testAddress='2001:db8:'+runId.slice(0,24).match(/.{4}/g).join(':')
const sessionProbe='audit-session-'+runId
const email=qa+'@gmail.com'
const nextEmail=qa+'new@gmail.com'
const isolatedEmail=qa+'isolated@gmail.com'
const throttledEmail=qa+'throttled@gmail.com'
let passed = 0
const passCheck = label => console.log('PASS ' + (++passed) + ' ' + label)
const pass='QA-'+randomUUID()
const db=await database()
const routes={'/api/auth':auth,'/api/workspace':workspace,'/api/user/profile':profile,'/api/user/avatar':avatar}
const server=createServer(async(req,res)=>{
 // Isolate disposable traffic from the development loopback rate-limit bucket.
 Object.defineProperty(req.socket,'remoteAddress',{value:testAddress,configurable:true})
 for (const {key,value} of headers) res.setHeader(key,value)
 const path=req.url.split('?')[0]
 if(routes[path]) return routes[path](req,res)
 const file=/^\/(assets|images)\/[\w.-]+$/.test(path)||path==='/favicon.svg'?'dist'+path:'dist/index.html'
 const type=file.endsWith('.css')?'text/css':file.endsWith('.js')?'text/javascript':file.endsWith('.png')?'image/png':file.endsWith('.webp')?'image/webp':file.endsWith('.svg')?'image/svg+xml':'text/html'
 try{res.setHeader('Content-Type',type);res.end(await readFile(file))}catch{res.statusCode=404;res.end()}
})
let browser, account
try {
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve))
 const origin='http://127.0.0.1:'+server.address().port
 browser=await chromium.launch(process.env.TASKFORGE_BROWSER_CHANNEL ? {channel:process.env.TASKFORGE_BROWSER_CHANNEL} : {})
 const page=await browser.newPage({viewport:{width:390,height:844}})
 page.setDefaultTimeout(12000)
 const errors=[]
 await page.addInitScript(() => {
   globalThis.cspViolations = []
   document.addEventListener('securitypolicyviolation', event => globalThis.cspViolations.push(event.effectiveDirective))
 })
 page.on('pageerror',error=>errors.push(error.message))
 const heading=name=>page.getByRole('heading',{name,exact:true,level:1})
 const button=name=>page.getByRole('button',{name,exact:true})
 const field=name=>page.getByLabel(name,{exact:true})
 async function navigate(path) {await page.goto(origin+path)}
 async function persist(action) {
   const response=page.waitForResponse(r=>r.url().endsWith('/api/workspace') && r.request().method()==='PUT')
   await action()
   const result=await response
   if (!result.ok()) throw Error('Workspace write '+result.status()+': '+await result.text())
 }
 const check=async label=>assert(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth),label)
 async function entry(kind,title,options={}) {
   const dialog=page.getByRole('dialog')
   await dialog.getByLabel(kind==='habit'?'Habit name':'Title',{exact:true}).fill(title)
   if (options.daily) await dialog.getByLabel('Recurrence',{exact:true}).selectOption('Daily')
   if (options.priority) await dialog.getByLabel('Priority',{exact:true}).selectOption(options.priority)
   await persist(()=>dialog.getByRole('button',{name:'Save '+kind,exact:true}).click())
 }
 await navigate('/profile')
 await heading('Login').waitFor()
 assert.equal(new URL(page.url()).pathname,'/login')
 await button('Login').click()
 await page.getByRole('alert').getByText('Enter a valid Gmail address.').waitFor()
 await page.locator('#auth-password').focus()
 await page.keyboard.press('Shift+Tab')
 assert(await field('Email').evaluate(input=>input.matches(':focus-visible')))
 await field('Email').fill('temporary@gmail.com')
 const focus = await field('Email').evaluate(input => {
   const style = getComputedStyle(input)
   return {outline:style.outlineStyle,border:style.borderTopWidth,shadow:style.boxShadow,background:style.backgroundColor,
     outer:getComputedStyle(input.parentElement).borderTopColor,gold:getComputedStyle(input).getPropertyValue('--gold').trim()}
 })
 assert.deepEqual([focus.outline,focus.border,focus.shadow,focus.background],['none','0px','none','rgba(0, 0, 0, 0)'])
 assert.equal(focus.outer,'rgb(246, 198, 103)')
 await button('Show password').click()
 assert.equal(await page.locator('#auth-password').getAttribute('type'),'text')
 passCheck('protected route, empty validation, and single email focus border')
 await navigate('/signup')
 await heading('Sign Up').waitFor()
 await field('Email').click()
 assert.deepEqual(await field('Email').evaluate(input=>[getComputedStyle(input).outlineStyle,getComputedStyle(input.parentElement).borderTopColor]),['none','rgb(246, 198, 103)'])
 await field('Name').fill('Task Forge')
 await field('Email').fill(email)
 await page.locator('#auth-password').fill(pass)
 await button('Sign Up').click()
 await page.getByRole('heading',{name:/Good (Morning|Afternoon|Evening)/}).waitFor()
 const initial=(await (await page.request.get(origin+'/api/auth')).json()).user
 account=initial.accountId
 const work=()=>db.collection('taskforge_workspaces').findOne({_id:'user:'+account})
 assert.deepEqual((await work()).data.items,[])
 assert.deepEqual(await page.locator('.mobile-stats strong').allTextContents(),['0','0','0'])
 const created = await db.collection('users').findOne({_id:account})
 assert(created.createdAt instanceof Date && created.passwordHash !== pass && !created.password)
 assert.equal(created.passwordVersion,2)
 assert.equal(db.databaseName,'Traker')
 passCheck('registration uses hashed passwords and starts with empty Atlas records')
 await button('Add a task').click()
 await entry('task','Recurring QA',{daily:true,priority:'Urgent'})
 const nav=page.getByRole('navigation',{name:'Quick navigation'})
 await nav.getByRole('link',{name:'Tasks',exact:true}).click()
 await heading('Weekly Tasks').waitFor()
 const statuses=page.locator('.mobile-task-row .state')
 const originalDay=today()
 await persist(()=>statuses.click())
 assert.match(await statuses.getAttribute('aria-label'),/Completed/)
 const dateChoice=page.locator('.mobile-day-strip button')
 const dayIndex=weekDays(originalDay).indexOf(originalDay)
 const secondDay=dayIndex===6?shift(originalDay,-1):shift(originalDay,1)
 if (dayIndex===6) {
   await button('Next week').click()
   await dateChoice.first().click()
 } else await dateChoice.nth(dayIndex+1).click()
 const recordedSecond=dayIndex===6?shift(originalDay,1):secondDay
 assert.match(await statuses.getAttribute('aria-label'),/Pending/)
 await persist(()=>statuses.click())
 await persist(()=>statuses.click())
 await persist(()=>statuses.click())
 const task=(await work()).data.items.find(item=>item.title==='Recurring QA')
 assert.equal(task.records[originalDay],'DONE')
 assert.equal(task.records[recordedSecond],'PENDING')
 await page.locator('.task-actions summary').click()
 await button('Duplicate').click()
 await button('Recurring QA (copy)').waitFor()
 passCheck('mobile task creation, date selection, three-state cycle, duplication and Atlas persistence')
 await nav.getByRole('link',{name:'Calendar',exact:true}).click()
 await heading('Monthly Planner').waitFor()
 await button('Add to Monthly Planner').click()
 await entry('activity','Grid QA')
 const grid=page.locator('.monthly-matrix')
 const scroll=page.locator('.monthly-planner .matrix-wrap')
 assert((await grid.locator('thead th').count())>=29)
 assert(await scroll.evaluate(node=>node.scrollWidth>node.clientWidth))
 await scroll.evaluate(node=>node.scrollLeft=node.scrollWidth)
 assert(await scroll.evaluate(node=>node.scrollLeft>0))
 assert.equal(await grid.locator('tbody th').evaluate(node=>getComputedStyle(node).position),'sticky')
 await persist(()=>grid.getByRole('button',{name:/Grid QA.*Pending/}).last().click())
 await nav.getByRole('link',{name:'Home',exact:true}).click()
 await button('Add to Habit Tracker').click()
 await entry('habit','Habit QA')
 await persist(()=>page.locator('.mobile-dashboard .matrix button.state').first().click())
 passCheck('full month with sticky activity names, tracking on a later date, and habit update')
 await page.setViewportSize({width:1024,height:844})
 for (const [path,buttonName,newKind,newTitle] of [
   ['/today','Add to Daily Tracker','routine','Routine QA'],
   ['/quarterly','Add to Quarterly Goals','quarterly goal','Quarter QA'],
   ['/yearly','Add to Annual Goals','annual goal','Annual QA'],
   ['/notes','Add to Notes / Reminders','note','Note QA']
 ]) {
   await navigate(path)
   await button(buttonName).click()
   if (newKind==='quarterly goal' || newKind==='annual goal') {
     const day=await page.getByRole('dialog').getByLabel('Target date').inputValue()
     assert(day)
   }
   await entry(newKind,newTitle)
   await button(newTitle).waitFor()
 }
 await navigate('/quarterly')
 await button('Next quarter').click()
 await page.getByText('Set your first quarterly goal.').waitFor()
 await button('Previous quarter').click()
 await button('Quarter QA').waitFor()
 await navigate('/yearly')
 await button('Next year').click()
 await page.getByText('Set your first annual goal.').waitFor()
 await button('Previous year').click()
 await button('Annual QA').waitFor()
 passCheck('daily, quarterly, yearly and note creation plus period navigation')
 await navigate('/notes')
 await page.getByRole('searchbox',{name:'Search notes'}).fill('no such record')
 await page.getByText('No matching notes.').waitFor()
 await page.getByRole('searchbox',{name:'Search notes'}).fill('')
 await button('Note QA').click()
 await page.getByLabel('Schedule reminder').check()
 await page.getByLabel('Reminder time').fill('18:30')
 await persist(()=>button('Save note').click())
 await persist(()=>page.getByRole('button',{name:/Note QA reminder.*Pending/}).click())
 const reminderTitle = page.locator('.note-row .row-title').filter({hasText:'Note QA'})
 await reminderTitle.click()
 await button('Delete').click()
 await persist(()=>button('Confirm delete').click())
 await reminderTitle.waitFor({state:'detached'})
 await navigate('/dashboard')
 await button('Add to Weekly Focus').click()
 await entry('priority','Focus QA')
 await persist(()=>page.getByRole('button',{name:/Focus QA.*Pending/}).click())
 await button('Add task for '+originalDay).click()
 const historical = shift(originalDay,-1)
 await page.getByLabel('Start date',{exact:true}).fill(historical)
 await page.getByLabel('Task status',{exact:true}).selectOption('DONE')
 await entry('task','History QA',{daily:true})
 const firstHistory = button('History QA').first()
 await firstHistory.click()
 await page.getByLabel('Status date',{exact:true}).fill(historical)
 await page.getByLabel('Task status',{exact:true}).selectOption('MISSED')
 await persist(()=>button('Save task').click())
 assert.deepEqual((await work()).data.items.find(item=>item.title==='History QA').records,{[historical]:'MISSED'})
 await firstHistory.click()
 await button('Delete').click()
 await persist(()=>button('Confirm delete').click())
 await firstHistory.waitFor({state:'detached'})
 await navigate('/monthly')
 await page.getByLabel('Select month and year').fill('2024-02')
 assert.equal(await page.locator('.monthly-matrix thead th').count(),30)
 passCheck('note filters and reminder completion, weekly-goal status, historical task edit/delete and leap-month UI')
 await page.setViewportSize({width:390,height:844})
 await nav.getByRole('link',{name:'Profile',exact:true}).click()
 await heading('Task Forge').waitFor()
 await button('Edit Profile').click()
 await field('Full name').fill('Profile QA')
 const policy = await page.request.patch(origin+'/api/user/profile',{data:{name:'Profile QA',email:nextEmail}})
 assert.equal(policy.status(),400)
 const foreign = await page.request.patch(origin+'/api/user/profile',{headers:{Origin:'https://outside.example'},data:{name:'Profile QA',email}})
 assert.equal(foreign.status(),415)
 await field('Gmail address').fill(nextEmail)
 await field('Current password').fill(pass)
 await button('Save changes').click()
 await heading('Profile QA').waitFor()
 await page.locator('input[type=file]').setInputFiles({name:'invalid.txt',mimeType:'text/plain',buffer:Buffer.from('fixture')})
 await page.getByRole('alert').getByText(/up to 5 MB/).waitFor()
 await page.locator('input[type=file]').setInputFiles({name:'large.png',mimeType:'image/png',buffer:Buffer.alloc(5*1024*1024+1)})
 await page.getByRole('alert').getByText(/up to 5 MB/).waitFor()
 const rejected = await page.request.post(origin+'/api/user/avatar',{data:{image:Buffer.from('test fixture').toString('base64')}})
 assert.equal(rejected.status(),400)
 const image=await sharp({create:{width:420,height:300,channels:3,background:'#f6c667'}}).png().toBuffer()
 await page.locator('input[type=file]').setInputFiles({name:'avatar.png',mimeType:'image/png',buffer:image})
 await page.getByRole('img',{name:'Circular picture preview'}).waitFor()
 await button('Save picture').click()
 await page.locator('.profile-hero img').waitFor()
 await page.waitForFunction(()=>document.querySelector('.profile-hero img')?.naturalWidth===256)
 await page.reload()
 await heading('Profile QA').waitFor()
 await page.waitForFunction(()=>document.querySelector('.profile-hero img')?.naturalWidth===256)
 assert.equal(await db.collection('taskforge_avatars').countDocuments({owner:account}),1)
 await button('Open profile menu').click()
 await page.getByText(nextEmail,{exact:true}).last().waitFor()
 await page.keyboard.press('Escape')
 assert.equal(await button('Open profile menu').getAttribute('aria-expanded'),'false')
 await button('Remove picture').click()
 await page.locator('.profile-hero img').waitFor({state:'detached'})
 assert.equal(await db.collection('taskforge_avatars').countDocuments({owner:account}),0)
 passCheck('profile reauthentication, cross-origin rejection, avatar validation, crop, refresh persistence and removal')
 for (const width of [320,375,390,430,768,1024,1440,1920]) {
   await page.setViewportSize({width,height:844})
   for (const path of ['/dashboard','/tasks','/monthly','/profile','/analytics']) {
     await navigate(path)
     await page.locator('.main-content').waitFor()
     await check(width+' '+path)
     assert.deepEqual(await page.evaluate(()=>globalThis.cspViolations),[])
   }
   const mobile=width<768
   assert.equal(await nav.isVisible(),mobile)
   await navigate('/dashboard')
   await page.locator('.main-content').waitFor()
   if (width===390 || width===1024) await page.screenshot({path:process.env.TEMP+'/taskforge-workspace-'+width+'.png',animations:'disabled'})
 }
 passCheck('dashboard, tasks, monthly, profile and analytics at all eight viewport widths')
 const other=await browser.newPage()
 await other.goto(origin+'/login')
 await other.getByLabel('Email',{exact:true}).fill(nextEmail)
 await other.locator('#auth-password').fill(pass)
 await other.getByRole('button',{name:'Login',exact:true}).click()
 await other.getByRole('heading',{name:'To-Do Dashboard',exact:true}).waitFor()
 const profileData=(await (await other.request.get(origin+'/api/user/profile')).json()).user
 assert.equal(profileData.name,'Profile QA')
 assert.equal(profileData.accountId,account)
 const authHeaders={'X-TaskForge-Account':account}
 const snapshot=await (await page.request.get(origin+'/api/workspace',{headers:authHeaders})).json()
 assert.equal((await other.request.put(origin+'/api/workspace',{data:snapshot,headers:authHeaders})).status(),200)
 assert.equal((await page.request.put(origin+'/api/workspace',{data:snapshot,headers:authHeaders})).status(),409)
 const malformed = await page.request.put(origin+'/api/workspace',{data:{data:{version:1,items:[]},revision:{value:2}},headers:authHeaders})
 assert.equal(malformed.status(),400)
 const authCookie=(await other.context().cookies()).find(cookie=>cookie.name==='taskforge_account')
 assert.equal(authCookie.httpOnly,true)
 assert.equal(authCookie.sameSite,'Lax')
 const cookieId=createHash('sha256').update(authCookie.value).digest('hex')
 await db.collection('taskforge_sessions').updateOne({_id:cookieId,userId:account},{$set:{expiresAt:new Date(0)}})
 assert.equal((await other.request.get(origin+'/api/workspace',{headers:authHeaders})).status(),401)
 const duplicate=await page.request.post(origin+'/api/auth',{data:{action:'signup',name:'Duplicate',email:nextEmail,password:pass}})
 assert.equal(duplicate.status(),409)
 const wrong=await page.request.post(origin+'/api/auth',{data:{action:'login',email:nextEmail,password:'incorrect-password'}})
 const unknown=await page.request.post(origin+'/api/auth',{data:{action:'login',email:throttledEmail,password:pass}})
 assert.equal(wrong.status(),401)
 assert.equal(unknown.status(),401)
 assert.deepEqual(await wrong.json(),await unknown.json())
 passCheck('relogin, optimistic concurrency, defensive validation, session expiry and generic login errors')
 assert((await work()).data.items.some(item=>item.title==='Habit QA'))
 const isolated=await browser.newPage()
 const signup=await isolated.request.post(origin+'/api/auth',{data:{action:'signup',name:'Isolation QA',email:isolatedEmail,password:pass}})
 const isolatedUser=(await signup.json()).user
 assert(isolatedUser.accountId!==account)
 assert.equal((await isolated.request.get(origin+'/api/workspace',{headers:{'X-TaskForge-Account':account}})).status(),401)
 assert.equal((await isolated.request.get(origin+'/api/user/avatar?v=unknown')).status(),404)
 await isolated.goto(origin+'/dashboard')
 await isolated.getByRole('heading',{name:'To-Do Dashboard',exact:true}).waitFor()
 assert.equal((await db.collection('taskforge_workspaces').findOne({_id:'user:'+isolatedUser.accountId})).data.items.length,0)
 for (const width of [320,375,390,430,768,1024,1440,1920]) {
   const guest=await browser.newPage({viewport:{width,height:844}})
   await guest.goto(origin+'/login')
   await guest.getByRole('heading',{name:'Login',exact:true}).waitFor()
   assert.equal(await guest.locator('form input').count(),2)
   assert(await guest.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
   await guest.getByRole('link',{name:'Sign Up'}).click()
   await guest.getByRole('heading',{name:'Sign Up',exact:true}).waitFor()
   assert.equal(await guest.locator('form input').count(),3)
   assert(await guest.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
   await guest.close()
 }
 passCheck('account isolation and two/three-field auth layouts across eight widths')
 const active=(await page.context().cookies()).find(cookie=>cookie.name==='taskforge_account')
 await page.getByRole('button',{name:'Open profile menu'}).click()
 await page.getByRole('button',{name:'Logout',exact:true}).click()
 await heading('Login').waitFor()
 assert.equal(await db.collection('taskforge_sessions').findOne({_id:createHash('sha256').update(active.value).digest('hex')}),null)
 for (let i=0;i<12;i++) {
   const response=await page.request.post(origin+'/api/auth',{data:{action:'login',email:throttledEmail,password:pass}})
   assert.equal(response.status(),i===11 ? 429 : 401)
   if (i===11) assert(Number(response.headers()['retry-after'])>0)
 }
 passCheck('logout revokes the server session and authentication limits return Retry-After')
 const probeRequest = cookie => ({headers:{cookie},socket:{encrypted:true}})
 let sessionCookie
 const response = {setHeader(_name,value) {sessionCookie=value}}
 await startSession(probeRequest(),response,sessionProbe)
 assert.match(sessionCookie,/; Secure/)
 assert.match(sessionCookie,/; HttpOnly/)
 assert.match(sessionCookie,/; SameSite=Lax/)
 const previous = sessionCookie.split(';')[0]
 await startSession(probeRequest(previous),response,sessionProbe)
 const current = sessionCookie.split(';')[0]
 assert.notEqual(current,previous)
 assert.equal(await readSession(probeRequest(previous)),null)
 assert.equal((await readSession(probeRequest(current))).userId,sessionProbe)
 await endSession(probeRequest(current),response)
 assert.equal(await readSession(probeRequest(current)),null)
 passCheck('encrypted-response cookie attributes and session rotation')
 assert.deepEqual(errors,[])
 assert(monthDays(today()).length>=28)
 console.log('Browser/Atlas audit: '+passed+' passed, 0 failed, 0 skipped.')
} catch(error) {console.error(error);process.exitCode=1}
finally {
 await browser?.close()
 const identities=await db.collection('users').find({loginKey:{$in:[email,nextEmail,isolatedEmail]}}).toArray()
 for (const user of identities) {
   await db.collection('taskforge_avatars').deleteMany({owner:user._id})
   await db.collection('taskforge_sessions').deleteMany({userId:user._id})
   await db.collection('taskforge_workspaces').deleteOne({_id:'user:'+user._id})
   await db.collection('users').deleteOne({_id:user._id})
 }
 for (const address of [email,nextEmail,isolatedEmail,throttledEmail]) {
   const digest=createHash('sha256').update(address).digest('hex')
   await db.collection('taskforge_auth_limits').deleteMany({_id:new RegExp('^login-account:'+digest+':')})
 }
 const addressHash = createHash('sha256').update(testAddress).digest('hex')
 await db.collection('taskforge_auth_limits').deleteMany({_id:new RegExp('^(login|signup)-ip:'+addressHash+':')})
 await db.collection('taskforge_sessions').deleteMany({userId:sessionProbe})
 server.close()
}
process.exit()
