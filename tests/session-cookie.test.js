// Run only against an isolated server/database with matching TEST_* settings.
import test from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import signature from 'cookie-signature';
import {randomUUID} from 'node:crypto';

const url=process.env.TEST_APP_URL,secret=process.env.TEST_SESSION_SECRET;

test('API reads cannot overwrite a freshly authenticated session with an older cookie', {timeout:20000}, async()=>{
  assert.ok(process.env.TEST_DATABASE_URL&&url&&secret,'Set TEST_* variables against an isolated server/database.');
  const db=new pg.Pool({connectionString:process.env.TEST_DATABASE_URL});
  const user=randomUUID(),freshSid=randomUUID(),sessionIds=[freshSid];
  let lock,locked=false,delayed;
  const controller=new AbortController();
  const request=(path,cookie)=>fetch(url+'/api'+path,{headers:{Cookie:cookie},signal:controller.signal});
  try {
    // Initialise a genuine anonymous app session without following Google.
    const start=await fetch(url+'/auth/google',{redirect:'manual'});
    assert.equal(start.status,302);
    const issued=start.headers.get('set-cookie');
    assert.ok(issued,'starting Google sign-in creates an app session');
    const oldCookie=issued.split(';')[0];
    const signedValue=decodeURIComponent(oldCookie.slice(oldCookie.indexOf('=')+1));
    const oldSid=signature.unsign(signedValue.slice(2),secret);
    assert.ok(oldSid,'anonymous cookie is signed with the test server secret');
    sessionIds.push(oldSid);
    assert.match(issued,/HttpOnly/i);
    assert.match(issued,/SameSite=Lax/i);
    const expiry=/Expires=([^;]+)/i.exec(issued);
    assert.ok(expiry);
    assert.ok(Math.abs(Date.parse(expiry[1])-Date.now()-365*86400000)<60000,'new login sessions retain a one-year cookie expiry');
    for(const path of ['/me','/listings']){
      const response=await request(path,oldCookie);
      assert.equal(response.status,200);
      assert.equal(response.headers.get('set-cookie'),null,'anonymous '+path+' must not renew the pre-login cookie');
      await response.json();
    }

    // Hold the actual feed query after the server has loaded the old session.
    // Replacing its database session below models login's session rotation.
    // The late feed response must not replace the browser's new login cookie.
    lock=await db.connect();
    await lock.query('BEGIN');
    await lock.query('LOCK TABLE listings IN ACCESS EXCLUSIVE MODE');
    locked=true;
    delayed=request('/listings',oldCookie);
    delayed.catch(()=>{});
    let waiting=false;
    for(let attempt=0;attempt<100;attempt++){
      const result=await db.query("SELECT EXISTS(SELECT 1 FROM pg_locks WHERE relation='listings'::regclass AND NOT granted) AS waiting");
      if(result.rows[0].waiting){waiting=true;break;}
      await new Promise(resolve=>setTimeout(resolve,50));
    }
    assert.ok(waiting,'pre-login feed response remains in flight during session replacement');
    await db.query('INSERT INTO users(id,email,name) VALUES($1,$2,$3)',[user,user+'@example.com','Session cookie fixture']);
    await db.query("INSERT INTO session(sid,sess,expire) VALUES($1,$2,NOW()+INTERVAL '1 year')",[freshSid,{cookie:{originalMaxAge:365*86400000,httpOnly:true,secure:new URL(url).protocol==='https:',sameSite:'lax'},user}]);
    await db.query('DELETE FROM session WHERE sid=$1',[oldSid]);
    const freshCookie='connect.sid='+encodeURIComponent('s:'+signature.sign(freshSid,secret));
    await lock.query('COMMIT');
    locked=false;
    const late=await delayed;
    assert.equal(late.status,200);
    assert.equal(late.headers.get('set-cookie'),null,'late pre-login API response must not restore the revoked cookie');
    await late.json();

    for(const path of ['/me','/listings']){
      const response=await request(path,freshCookie);
      assert.equal(response.status,200);
      assert.equal(response.headers.get('set-cookie'),null,'authenticated '+path+' must not renew the read cookie');
      const data=await response.json();
      if(path==='/me')assert.equal(data.user.id,user,'fresh login survives the late anonymous response');
    }
    const revoked=await request('/me',oldCookie);
    assert.equal((await revoked.json()).user,null,'revoked pre-login session stays anonymous');
    assert.equal(revoked.headers.get('set-cookie'),null,'read with revoked session cannot overwrite the valid cookie');
  } finally {
    controller.abort();
    if(locked)await lock.query('ROLLBACK');
    lock?.release();
    if(delayed)await delayed.catch(()=>{});
    await db.query('DELETE FROM session WHERE sid=ANY($1::text[])',[sessionIds]);
    await db.query('DELETE FROM users WHERE id=$1',[user]);
    await db.end();
  }
});
