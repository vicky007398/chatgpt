// Install Playwright outside the checkout and set NODE_PATH to its node_modules.
// Run only with TEST_* values for an isolated local server/database.
const {chromium}=require('playwright');
const pg=require('pg');
const signature=require('cookie-signature');
const {randomUUID}=require('node:crypto');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const url=process.env.TEST_APP_URL,secret=process.env.TEST_SESSION_SECRET;
assert.ok(url&&secret&&process.env.TEST_DATABASE_URL,'Set isolated TEST_* variables');
const db=new pg.Pool({connectionString:process.env.TEST_DATABASE_URL});
const owner=randomUUID(),buyer=randomUUID(),listing=randomUUID(),conversation=randomUUID();
let browser;
(async()=>{
 try {
  // Initialise the session table through the real application's login route.
  await fetch(url+'/auth/google',{redirect:'manual'});
  const sessionIds={};
  for(const [id,name] of [[owner,'Sample owner'],[buyer,'Sample renter']]){
   await db.query('INSERT INTO users(id,email,name) VALUES($1,$2,$3)',[id,id+'@example.com',name]);
   const sid=randomUUID();sessionIds[id]=sid;
   await db.query("INSERT INTO session(sid,sess,expire) VALUES($1,$2,NOW()+INTERVAL '1 hour')",[sid,{cookie:{originalMaxAge:3600000,httpOnly:true,secure:false,sameSite:'lax'},user:id}]);
  }
  await db.query('INSERT INTO listings(id,owner,data,status) VALUES($1,$2,$3,$4)',[listing,owner,{title:'Sample Kosamba rental',name:'Sample owner',purpose:'rent',type:'House',configuration:'2 BHK',district:'Surat',village:'Kosamba',locality:'Gokuldham',address:'Sample address',price:8000,deposit:16000,unit:'sq ft',area:800,furnishing:'Unfurnished',phone:'9876543210'},'approved']);
  await db.query('INSERT INTO conversations(id,listing,buyer,seller) VALUES($1,$2,$3,$4)',[conversation,listing,buyer,owner]);
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
  async function context(user){
   const ctx=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1});
   await ctx.addInitScript(()=>sessionStorage.setItem('kosrent-welcome-shown','1'));
   await ctx.addCookies([{name:'connect.sid',value:encodeURIComponent('s:'+signature.sign(sessionIds[user],secret)),domain:new URL(url).hostname,path:'/'}]);
   return ctx;
  }
  const seller=await context(owner),renter=await context(buyer);
  const page=await seller.newPage(),recipient=await renter.newPage();
  await page.goto(url);await page.getByRole('button',{name:'Chats',exact:true}).click();
  await page.locator('.chat-list-row').filter({hasText:'Sample Kosamba rental'}).click();
  await page.getByRole('button',{name:'Block user',exact:true}).click();
  await page.getByRole('button',{name:'Unblock user',exact:true}).waitFor();
  assert.equal(await page.getByRole('textbox',{name:'Message',exact:true}).isDisabled(),true);
  await recipient.goto(url);await recipient.getByRole('button',{name:'Chats',exact:true}).click();
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
  console.log('Browser smoke passed: mobile block/unblock/report, participant composer protection, Profile deletion, permanent deletion and signed-out state.');
 } finally {
  if(browser)await browser.close();
  await db.query('DELETE FROM reports WHERE listing=$1 OR conversation=$2',[listing,conversation]);
  await db.query('DELETE FROM conversation_reads WHERE conversation=$1',[conversation]);
  await db.query('DELETE FROM messages WHERE conversation=$1',[conversation]);
  await db.query('DELETE FROM conversations WHERE id=$1',[conversation]);
  await db.query('DELETE FROM favourites WHERE listing=$1',[listing]);
  await db.query('DELETE FROM renewals WHERE listing=$1',[listing]);
  await db.query('DELETE FROM listings WHERE id=$1',[listing]);
  for(const id of [owner,buyer]){
   await db.query('DELETE FROM user_blocks WHERE blocker=$1 OR blocked=$1',[id]);
   await db.query("DELETE FROM session WHERE sess->>'user'=$1",[id]);
   await db.query('DELETE FROM users WHERE id=$1',[id]);
  }
  await db.end();
 }
})().catch(error=>{console.error(error);process.exitCode=1});
