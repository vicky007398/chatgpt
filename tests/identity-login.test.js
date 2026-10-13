import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import session from 'express-session';
import pg from 'pg';
import {randomUUID} from 'node:crypto';
import {registerIdentityLogin} from '../server/identity-login.js';
import {protectRequestOrigin} from '../server/request-origin.js';

test('direct app sign-in verifies Google identity, nonce, audience and session rotation',async()=>{
  assert.ok(process.env.TEST_DATABASE_URL,'Use an isolated database');
  const db=new pg.Pool({connectionString:process.env.TEST_DATABASE_URL}),id=randomUUID();
  const app=express();let server,base,payload,verified=0;
  app.use(express.json());
  app.use(session({secret:'isolated-identity-test-secret-32-chars',resave:false,saveUninitialized:false}));
  app.use('/api',(req,res,next)=>protectRequestOrigin(base)(req,res,next));
  const oauth={async verifyIdToken({idToken,audience}){
    verified++;assert.equal(audience,'fixture-client-id');
    if(idToken!=='fixture-verified-token')throw Error('Invalid signature');
    return {getPayload:()=>payload};
  }};
  registerIdentityLogin(app,{pool:db,oauth,asyncRoute:fn=>(req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next),adminEmails:()=>new Set([id+'@example.com']),clientId:'fixture-client-id'});
  app.get('/me',(req,res)=>res.json({user:req.session.user||null,admin:req.session.admin===true}));
  async function post(path,cookie,body,origin=base){return fetch(base+path,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},body:JSON.stringify(body||{})});}
  try {
    server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));base='http://127.0.0.1:'+server.address().port;
    assert.equal((await post('/api/auth/identity/start',null,null,'https://attacker.example')).status,403);
    assert.equal((await post('/api/auth/identity/finish',null,{credential:'fixture-verified-token'})).status,401);
    const start=await post('/api/auth/identity/start');const config=await start.json();
    assert.deepEqual(Object.keys(config).sort(),['clientId','nonce']);
    assert.equal(start.headers.get('cache-control'),'no-store');
    const cookie=start.headers.get('set-cookie').split(';')[0];
    payload={sub:id,email:id+'@example.com',name:'Identity fixture',email_verified:true,nonce:config.nonce};
    assert.equal((await post('/api/auth/identity/finish',cookie,{credential:'forged-token'})).status,401);
    payload.nonce='another-session';assert.equal((await post('/api/auth/identity/finish',cookie,{credential:'fixture-verified-token'})).status,401);
    payload.nonce=config.nonce;payload.email_verified=false;
    assert.equal((await post('/api/auth/identity/finish',cookie,{credential:'fixture-verified-token'})).status,401);
    payload.email_verified=true;
    const finish=await post('/api/auth/identity/finish',cookie,{credential:'fixture-verified-token'});
    assert.deepEqual(await finish.json(),{signedIn:true});
    const signedCookie=finish.headers.get('set-cookie').split(';')[0];
    assert.notEqual(signedCookie,cookie);
    assert.deepEqual(await (await fetch(base+'/me',{headers:{Cookie:signedCookie}})).json(),{user:id,admin:true});
    assert.equal((await post('/api/auth/identity/finish',signedCookie,{credential:'fixture-verified-token'})).status,401,'nonce consumed when session rotates');
    assert.equal((await post('/api/auth/identity/finish',cookie,{credential:'fixture-verified-token'})).status,401,'old session revoked');
    await db.query('UPDATE users SET blocked=true WHERE id=$1',[id]);
    const blockedStart=await post('/api/auth/identity/start');const blockedConfig=await blockedStart.json();
    payload.nonce=blockedConfig.nonce;
    assert.equal((await post('/api/auth/identity/finish',blockedStart.headers.get('set-cookie').split(';')[0],{credential:'fixture-verified-token'})).status,403);
    assert.ok(verified>=5,'server verifies credentials through the Google verifier');
  } finally {
    if(server)await new Promise(resolve=>server.close(resolve));
    await db.query('DELETE FROM users WHERE id=$1',[id]);await db.end();
  }
});
