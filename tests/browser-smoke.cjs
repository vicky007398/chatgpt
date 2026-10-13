// Install Playwright outside the checkout and set NODE_PATH to its node_modules.
// Run only with TEST_* values for an isolated local server/database.
const {chromium}=require('playwright');
const pg=require('pg');
const signature=require('cookie-signature');
const {randomUUID,randomBytes,createHash}=require('node:crypto');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const url=process.env.TEST_APP_URL,secret=process.env.TEST_SESSION_SECRET;
assert.ok(url&&secret&&process.env.TEST_DATABASE_URL,'Set isolated TEST_* variables');
const db=new pg.Pool({connectionString:process.env.TEST_DATABASE_URL});
const owner=randomUUID(),buyer=randomUUID(),admin=randomUUID(),listing=randomUUID(),conversation=randomUUID();
let browser;
const loginAttempts=[];
(async()=>{
 try {
  // Initialise the session table through the real application's login route.
  await fetch(url+'/auth/google',{redirect:'manual'});
  const sessionIds={};
  for(const [id,name] of [[owner,'Sample owner'],[buyer,'Sample renter'],[admin,'Test administrator']]){
   await db.query('INSERT INTO users(id,email,name) VALUES($1,$2,$3)',[id,id===admin?'integration-admin@example.com':id+'@example.com',name]);
   const sid=randomUUID();sessionIds[id]=sid;
   await db.query("INSERT INTO session(sid,sess,expire) VALUES($1,$2,NOW()+INTERVAL '1 hour')",[sid,{cookie:{originalMaxAge:3600000,httpOnly:true,secure:false,sameSite:'lax'},user:id}]);
  }
  await db.query('INSERT INTO listings(id,owner,data,status) VALUES($1,$2,$3,$4)',[listing,owner,{title:'Sample Kosamba rental',name:'Sample owner',purpose:'rent',type:'House',configuration:'2 BHK',district:'Surat',village:'Kosamba',locality:'Gokuldham',address:'Sample address',price:8000,deposit:16000,unit:'sq ft',area:800,furnishing:'Unfurnished',phone:'9876543210'},'approved']);
  await db.query('INSERT INTO conversations(id,listing,buyer,seller) VALUES($1,$2,$3,$4)',[conversation,listing,buyer,owner]);
  await db.query('INSERT INTO messages(id,conversation,sender,body) VALUES($1,$2,$3,$4)',[randomUUID(),conversation,buyer,'Hello, is this home available?']);
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
  async function context(user){
   const ctx=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1});
   if(process.env.TEST_LEGACY_ORIGIN==='1')await ctx.route('**/api/**',async route=>{
    const headers=await route.request().allHeaders();delete headers['x-kosrent-request'];delete headers['x-kosrent-visible'];
    await route.continue({headers});
   });
   await ctx.addInitScript(()=>sessionStorage.setItem('kosrent-welcome-shown','1'));
   await ctx.addCookies([{name:'connect.sid',value:encodeURIComponent('s:'+signature.sign(sessionIds[user],secret)),domain:new URL(url).hostname,path:'/'}]);
   return ctx;
  }
  // Simulate only Google's successful handoff; exercise the real completion page
  // and installed-app session refresh without using real Google credentials.
  const loginContext=await browser.newContext({viewport:{width:390,height:844}});
  await loginContext.addInitScript(()=>sessionStorage.setItem('kosrent-welcome-shown','1'));
  await loginContext.route('https://accounts.google.com/**',async route=>{
   const state=new URL(route.request().url()).searchParams.get('state');
   loginAttempts.push(state);
   await route.fulfill({status:200,contentType:'text/html',body:`<!doctype html><script>location.replace(${JSON.stringify(url+'/auth/google/callback?state='+state+'&code=fixture')})</script>`});
  });
  await loginContext.route('**/auth/google/callback?**',async route=>{
   const state=new URL(route.request().url()).searchParams.get('state');
   const receipt=randomBytes(32).toString('base64url');
   const result=await db.query("UPDATE app_login_attempts SET status='complete',profile=$2,receipt_hash=$3 WHERE state=$1 AND status='pending' RETURNING state",[state,{sub:buyer,email:buyer+'@example.com',name:'Sample renter'},createHash('sha256').update(receipt).digest('hex')]);
   assert.equal(result.rowCount,1,'real app session started an OAuth attempt');
   await route.fulfill({status:200,contentType:'text/html',body:`<!doctype html><span id="app-login-receipt" data-state="${state}" data-receipt="${receipt}"></span><script src="/auth-return.js"></script>`});
  });
  const appWindow=await loginContext.newPage();
  await appWindow.goto(url);
  await appWindow.getByRole('button',{name:'Profile',exact:true}).first().click();
  const popupPromise=appWindow.waitForEvent('popup');
  await appWindow.getByRole('link',{name:'Continue with Google'}).click();
  const authWindow=await popupPromise;
  if(!authWindow.isClosed())await authWindow.waitForEvent('close');
  await appWindow.getByRole('link',{name:'Continue with Google'}).waitFor({state:'hidden'});
  await appWindow.getByRole('button',{name:'Profile',exact:true}).first().click();
  await appWindow.getByRole('heading',{name:'Sample renter',exact:true}).waitFor();
  assert.equal(appWindow.url(),url+'/','OAuth leaves the installed app on its original page');
  await loginContext.close();
  console.log('Google return simulation passed: completion closes popup and app restores signed-in session.');
  // Reproduce Android losing the browser storage event after shared-cookie login.
  const sharedContext=await browser.newContext({viewport:{width:390,height:844}});
  await sharedContext.addInitScript(()=>sessionStorage.setItem('kosrent-welcome-shown','1'));
  await sharedContext.route('https://accounts.google.com/**',async route=>{
   loginAttempts.push(new URL(route.request().url()).searchParams.get('state'));
   await sharedContext.addCookies([{name:'connect.sid',value:encodeURIComponent('s:'+signature.sign(sessionIds[buyer],secret)),domain:new URL(url).hostname,path:'/'}]);
   await route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><script>window.close()</script>'});
  });
  const sharedApp=await sharedContext.newPage();
  await sharedApp.goto(url);
  await sharedApp.getByRole('button',{name:'Profile',exact:true}).first().click();
  const sharedPopupPromise=sharedApp.waitForEvent('popup');
  await sharedApp.getByRole('link',{name:'Continue with Google'}).click();
  const sharedPopup=await sharedPopupPromise;
  if(!sharedPopup.isClosed())await sharedPopup.waitForEvent('close');
  await sharedApp.getByRole('link',{name:'Continue with Google'}).waitFor({state:'hidden'});
  await sharedApp.getByRole('button',{name:'Profile',exact:true}).first().click();
  await sharedApp.getByRole('heading',{name:'Sample renter',exact:true}).waitFor();
  assert.equal(await sharedApp.evaluate(()=>localStorage.getItem('kosrent-sign-in')),null,'session restores without a browser receipt or storage event');
  await sharedContext.close();
  console.log('Shared Chrome session return passed without storage notifications.');
  const seller=await context(owner),renter=await context(buyer);
  const page=await seller.newPage(),recipient=await renter.newPage();
  await page.goto(url);
  await page.getByRole('button',{name:'Profile',exact:true}).first().click();
  await page.getByRole('heading',{name:'Sample owner',exact:true}).waitFor();
  await page.getByRole('button',{name:'Close',exact:true}).click();
  await page.getByRole('button',{name:'Chats',exact:true}).click();
  // Reproduce installed-browser read requests that report an opaque origin.
  await page.route('**/api/conversations/*/read',async route=>{
   const headers=await route.request().allHeaders();assert.equal(headers['x-kosrent-visible'],'1');
   if(process.env.TEST_LEGACY_ORIGIN==='1'){delete headers['x-kosrent-request'];delete headers['x-kosrent-visible']}else assert.equal(headers['x-kosrent-request'],'1');
   await route.continue({headers:{...headers,origin:'null'}});
  });
  const readResponse=page.waitForResponse(r=>r.url().endsWith('/read')&&r.request().method()==='POST').catch(()=>null);
  await page.locator('.chat-list-row').filter({hasText:'Sample Kosamba rental'}).click();
  const read=await readResponse;assert.ok(read,'chat read request must complete');
  console.log('Browser read origin:',(await read.request().allHeaders()).origin,'status:',read.status());
  assert.equal(read.status(),200,'opening an existing chat must mark messages read');
  await page.getByRole('button',{name:'Block user',exact:true}).click();
  await page.getByRole('button',{name:'Unblock user',exact:true}).waitFor();
  assert.equal(await page.getByRole('textbox',{name:'Message',exact:true}).isDisabled(),true);
  await recipient.goto(url);
  await recipient.getByRole('button',{name:'Profile',exact:true}).first().click();
  await recipient.getByRole('heading',{name:'Sample renter',exact:true}).waitFor();
  await recipient.getByRole('button',{name:'Close',exact:true}).click();
  await recipient.getByRole('button',{name:'Chats',exact:true}).click();
  await recipient.locator('.chat-list-row').filter({hasText:'Sample Kosamba rental'}).click();
  await recipient.getByRole('button',{name:'User blocked',exact:true}).waitFor();
  assert.equal(await recipient.getByRole('textbox',{name:'Message',exact:true}).isDisabled(),true);
  page.once('dialog',dialog=>dialog.accept('Sample conversation abuse report'));
  await page.getByRole('button',{name:'Report user',exact:true}).click();
  await page.getByText('Report sent to the administrator for review.').waitFor();
  assert.equal((await db.query('SELECT id FROM reports WHERE reporter=$1 AND conversation=$2',[owner,conversation])).rowCount,1);
  await page.getByRole('button',{name:'Unblock user',exact:true}).click();
  await page.getByRole('button',{name:'Block user',exact:true}).waitFor();
  assert.equal(await page.getByRole('textbox',{name:'Message',exact:true}).isDisabled(),false);
  // Verify added controls still fit a narrow phone viewport.
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
  if(process.env.TEST_SCREENSHOT_DIR){fs.mkdirSync(process.env.TEST_SCREENSHOT_DIR,{recursive:true});await page.screenshot({path:process.env.TEST_SCREENSHOT_DIR+'/chat-test.png'});}
  const adminContext=await context(admin),adminPage=await adminContext.newPage();
  await adminPage.goto(url);await adminPage.getByRole('button',{name:'Profile',exact:true}).last().click();
  await adminPage.getByRole('button',{name:'Usage analytics',exact:true}).click();
  await adminPage.getByRole('heading',{name:'Usage analytics',exact:true}).waitFor();
  await adminPage.getByText('Registered users',{exact:true}).waitFor();
  assert.equal(await adminPage.locator('.analytics-table tbody tr').count(),30);
  assert.ok(await adminPage.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
  if(process.env.TEST_SCREENSHOT_DIR)await adminPage.screenshot({path:process.env.TEST_SCREENSHOT_DIR+'/analytics-test.png'});
  await page.getByRole('button',{name:'Profile',exact:true}).last().click();
  await page.getByRole('link',{name:'Delete account',exact:true}).click();
  await page.getByText('Signed in as '+owner+'@example.com',{exact:true}).waitFor();
  await page.getByLabel('I understand this permanently deletes my KosRent account and data.').check();
  await page.getByRole('button',{name:'Delete my account permanently'}).click();
  await page.getByText('Your KosRent account and data have been deleted.',{exact:true}).waitFor();
  assert.equal((await db.query('SELECT id FROM users WHERE id=$1',[owner])).rowCount,0);
  assert.equal((await db.query('SELECT id FROM users WHERE id=$1',[buyer])).rowCount,1);
  await page.reload();await page.getByRole('link',{name:'Continue with Google, then return to this page'}).waitFor();
  assert.match(await page.getByRole('link',{name:'Continue with Google, then return to this page'}).getAttribute('href'),/returnTo=delete-account/);
  console.log('Browser smoke passed: private mobile admin analytics, block/unblock/report, participant composer protection, Profile deletion, permanent deletion and signed-out state.');
 } finally {
  await db.query('DELETE FROM app_login_attempts WHERE state=ANY($1::text[])',[loginAttempts]);
  if(browser)await browser.close();
  await db.query('DELETE FROM reports WHERE listing=$1 OR conversation=$2',[listing,conversation]);
  await db.query('DELETE FROM conversation_reads WHERE conversation=$1',[conversation]);
  await db.query('DELETE FROM messages WHERE conversation=$1',[conversation]);
  await db.query('DELETE FROM conversations WHERE id=$1',[conversation]);
  await db.query('DELETE FROM favourites WHERE listing=$1',[listing]);
  await db.query('DELETE FROM renewals WHERE listing=$1',[listing]);
  await db.query('DELETE FROM listings WHERE id=$1',[listing]);
  for(const id of [owner,buyer,admin]){
   await db.query('DELETE FROM user_blocks WHERE blocker=$1 OR blocked=$1',[id]);
   await db.query("DELETE FROM session WHERE sess->>'user'=$1",[id]);
   await db.query('DELETE FROM users WHERE id=$1',[id]);
  }
  await db.end();
 }
})().catch(error=>{console.error(error);process.exitCode=1});
