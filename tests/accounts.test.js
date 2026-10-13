// Uses only isolated synthetic fixtures, never a production database.
import test from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import signature from 'cookie-signature';
import {randomUUID} from 'node:crypto';
const url=process.env.TEST_APP_URL,secret=process.env.TEST_SESSION_SECRET;

test('account deletion protects other users and removes linked records; blocking spans listings',async()=>{
  assert.ok(process.env.TEST_DATABASE_URL&&url&&secret,'Set TEST_* variables against an isolated server/database.');
  const db=new pg.Pool({connectionString:process.env.TEST_DATABASE_URL});
  const owner=randomUUID(),buyer=randomUUID(),other=randomUUID();
  const listing=randomUUID(),second=randomUUID(),kept=randomUUID(),photo=randomUUID();
  const conversation=randomUUID(),message=randomUUID();
  const cookies={};
  async function request(route,who,method='GET',body,origin=url){
    const response=await fetch(url+'/api'+route,{method,headers:{Origin:origin,'Content-Type':'application/json',...(who?{Cookie:cookies[who]}:{})},body:body?JSON.stringify(body):undefined});
    return {status:response.status,data:await response.json()};
  }
  try {
    await fetch(url+'/auth/google',{redirect:'manual'});
    for(const user of [owner,buyer,other]){
      await db.query('INSERT INTO users(id,email,name) VALUES($1,$2,$3)',[user,user+'@example.com','Test user']);
      for(let i=0;i<2;i++){
        const sid=randomUUID();
        await db.query("INSERT INTO session(sid,sess,expire) VALUES($1,$2,NOW()+INTERVAL '1 hour')",[sid,{cookie:{originalMaxAge:3600000,httpOnly:true,secure:false,sameSite:'lax'},user}]);
        cookies[user]='connect.sid='+encodeURIComponent('s:'+signature.sign(sid,secret));
      }
    }
    const anonymousCompletion=await fetch(url+'/auth/complete',{redirect:'manual'});
    assert.equal(anonymousCompletion.status,302);
    assert.equal(anonymousCompletion.headers.get('location'),'/');
    const completion=await fetch(url+'/auth/complete',{headers:{Cookie:cookies[owner]}});
    assert.equal(completion.status,200);
    assert.equal(completion.headers.get('cache-control'),'no-store');
    const completionHtml=await completion.text();
    assert.match(completionHtml,/auth-return.js/);
    assert.match(completionHtml,/id="return-to-app"/);
    assert.doesNotMatch(completionHtml,/<a[^>]*href="\/"/,'app return must not open the website inside the sign-in browser');
    const start=await fetch(url+'/auth/google?popup=1',{redirect:'manual'});
    assert.equal(start.status,302);
    const oauthLocation=new URL(start.headers.get('location'));
    assert.equal(oauthLocation.hostname,'accounts.google.com');
    assert.ok(oauthLocation.searchParams.get('state'));
    const invalidCallback=await fetch(url+'/auth/google/callback?code=fake&state=wrong');
    assert.equal(invalidCallback.status,400,'popup mode must not bypass OAuth state validation');
    for(const [id,user] of [[listing,owner],[second,owner],[kept,other]]){
      await db.query('INSERT INTO listings(id,owner,data,status) VALUES($1,$2,$3,$4)',[id,user,{title:'Deletion fixture',name:'Test owner',purpose:'rent',type:'House',village:'Kosamba',phone:'9876543210'},'approved']);
    }
    await db.query('INSERT INTO photos(id,owner,mime,body) VALUES($1,$2,$3,$4)',[photo,owner,'image/png',Buffer.from([137,80,78,71])]);
    await db.query('INSERT INTO conversations(id,listing,buyer,seller) VALUES($1,$2,$3,$4)',[conversation,listing,buyer,owner]);
    await db.query('INSERT INTO messages(id,conversation,sender,body) VALUES($1,$2,$3,$4)',[message,conversation,buyer,'Deletion test message']);
    await db.query('INSERT INTO conversation_reads(conversation,user_id,last_seq) SELECT $1,$2,seq FROM messages WHERE id=$3',[conversation,owner,message]);
    await db.query('INSERT INTO favourites(owner,listing) VALUES($1,$2),($3,$4)',[buyer,listing,owner,kept]);
    await db.query('INSERT INTO reports(id,reporter,listing,conversation,reason) VALUES($1,$2,$3,$4,$5)',[randomUUID(),buyer,listing,conversation,'Deletion fixture report']);
    await db.query('INSERT INTO renewals(id,listing,owner,reference,amount,policy_version,reviewer) VALUES($1,$2,$3,$4,100,$5,$6)',[randomUUID(),listing,owner,randomUUID(),'test',other]);
    await db.query('INSERT INTO renewals(id,listing,owner,reference,amount,policy_version,reviewer) VALUES($1,$2,$3,$4,100,$5,$6)',[randomUUID(),kept,other,randomUUID(),'test',owner]);
    assert.equal((await request('/conversations/'+conversation+'/block',owner,'POST',{})).status,200);
    assert.equal((await request('/conversations',owner)).data.find(c=>c.id===conversation).blocked_by_me,true);
    assert.equal((await request('/conversations',buyer)).data.find(c=>c.id===conversation).blocked,true);
    assert.equal((await request('/conversations',buyer,'POST',{listing:second})).status,403,'block applies to other listings by the same user');
    assert.equal((await request('/conversations/'+conversation+'/messages',buyer,'POST',{body:'No bypass'})).status,403);
    assert.equal((await request('/conversations/'+conversation+'/messages',other)).status,404);
    assert.equal((await request('/account',null,'DELETE',{confirmation:'DELETE'})).status,401);
    assert.equal((await request('/account',owner,'DELETE',{confirmation:'wrong'})).status,400);
    assert.equal((await request('/account',owner,'DELETE',{confirmation:'DELETE'},'https://evil.example')).status,403);
    await db.query('UPDATE users SET blocked=true WHERE id=$1',[owner]);
    assert.equal((await request('/account',owner)).data.user.id,owner,'suspended users can still delete their account');
    assert.equal((await request('/account',owner,'DELETE',{confirmation:'DELETE',userId:other})).status,200,'client userId cannot select another account');
    for(const [table,where,args] of [
      ['users','id=$1',[owner]],['listings','owner=$1',[owner]],['photos','owner=$1',[owner]],
      ['conversations','id=$1',[conversation]],['messages','conversation=$1',[conversation]],
      ['conversation_reads','conversation=$1',[conversation]],['reports','listing=$1',[listing]],
      ['favourites','owner=$1 OR listing=$2',[owner,listing]],['renewals','owner=$1',[owner]],
      ['user_blocks','blocker=$1 OR blocked=$1',[owner]],['session',"sess->>'user'=$1",[owner]]
    ])assert.equal((await db.query(`SELECT COUNT(*)::int AS n FROM ${table} WHERE ${where}`,args)).rows[0].n,0,table+' deleted');
    assert.equal((await db.query('SELECT COUNT(*)::int AS n FROM users WHERE id IN ($1,$2)',[buyer,other])).rows[0].n,2);
    assert.equal((await db.query('SELECT id FROM listings WHERE id=$1',[kept])).rowCount,1);
    assert.equal((await db.query('SELECT reviewer FROM renewals WHERE listing=$1',[kept])).rows[0].reviewer,null);
    assert.equal((await request('/me',owner)).data.user,null,'all owner sessions revoked');
    assert.equal((await request('/me',other)).data.user.id,other,'other account stays signed in');
    const page=await fetch(url+'/delete-account');assert.equal(page.status,200);assert.match(await page.text(),/Delete your KosRent account/);
    const login=await fetch(url+'/auth/google?returnTo=delete-account',{redirect:'manual'});assert.equal(login.status,302);assert.match(login.headers.get('location'),/^https:\/\/accounts\.google\.com\//);
  } finally {
    for(const id of [listing,second,kept]){
      await db.query('DELETE FROM reports WHERE listing=$1 OR conversation IN (SELECT id FROM conversations WHERE listing=$1)',[id]);
      await db.query('DELETE FROM conversation_reads WHERE conversation IN (SELECT id FROM conversations WHERE listing=$1)',[id]);
      await db.query('DELETE FROM messages WHERE conversation IN (SELECT id FROM conversations WHERE listing=$1)',[id]);
      await db.query('DELETE FROM conversations WHERE listing=$1',[id]);
      await db.query('DELETE FROM favourites WHERE listing=$1',[id]);
      await db.query('DELETE FROM renewals WHERE listing=$1',[id]);
      await db.query('DELETE FROM listings WHERE id=$1',[id]);
    }
    for(const user of [owner,buyer,other]){
      await db.query('DELETE FROM user_blocks WHERE blocker=$1 OR blocked=$1',[user]);
      await db.query('DELETE FROM photos WHERE owner=$1',[user]);
      await db.query("DELETE FROM session WHERE sess->>'user'=$1",[user]);
      await db.query('DELETE FROM users WHERE id=$1',[user]);
    }
    await db.end();
  }
});
