import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import session from 'express-session';
import pg from 'pg';
import {randomUUID,createHash} from 'node:crypto';
import {registerAppLogin} from '../server/app-login.js';
import {protectRequestOrigin} from '../server/request-origin.js';

test('installed-app OAuth tolerates a separate browser cookie jar while binding claims to the initiating session',async()=>{
  assert.ok(process.env.TEST_DATABASE_URL,'Use an isolated database');
  const db=new pg.Pool({connectionString:process.env.TEST_DATABASE_URL});
  const app=express(),issued=new Map(),states=[];
  const id=randomUUID();let server,base;
  app.use(express.json());
  app.use(session({secret:'isolated-app-login-test-secret-32-chars',resave:false,saveUninitialized:false}));
  app.use('/api',(req,res,next)=>protectRequestOrigin(base)(req,res,next));
  const oauth={
    generateAuthUrl(options){issued.set(options.state,options);return 'https://accounts.google.com/auth?'+new URLSearchParams(options);},
    async getToken({code,codeVerifier}){
      const options=issued.get(code);
      assert.equal(createHash('sha256').update(codeVerifier).digest('base64url'),options.code_challenge);
      assert.equal(options.code_challenge_method,'S256');
      return {tokens:{id_token:code}};
    },
    async verifyIdToken({idToken}){return {getPayload:()=>({sub:id,email:id+'@example.com',name:'OAuth fixture',email_verified:true,nonce:issued.get(idToken).nonce})};}
  };
  try {
    const complete=await registerAppLogin(app,{pool:db,oauth,asyncRoute:fn=>(req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next),adminEmails:()=>new Set(),returnPage:(res,success,proof)=>res.json({success,...proof})});
    app.get('/callback',async(req,res,next)=>{try{if(!await complete(req,res))res.sendStatus(400);}catch(e){next(e);}});
    app.get('/me',(req,res)=>res.json({user:req.session.user||null}));
    server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
    base='http://127.0.0.1:'+server.address().port;
    async function post(path,cookie,body,origin=base){return fetch(base+path,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},body:JSON.stringify(body||{})});}
    assert.equal((await post('/api/auth/start',null,null,'https://attacker.example')).status,403);
    const start=await post('/api/auth/start');const attempt=await start.json();states.push(attempt.state);
    const cookie=start.headers.get('set-cookie').split(';')[0];
    assert.equal((await post('/api/auth/finish',cookie,attempt)).status,200);
    // Callback intentionally sends no cookie from the installed app.
    const callback=await fetch(base+'/callback?'+new URLSearchParams({state:attempt.state,code:attempt.state}));
    const completed=await callback.json();assert.equal(completed.success,true);
    assert.ok(completed.receipt);
    assert.deepEqual(await (await post('/api/auth/finish',cookie,attempt)).json(),{pending:true},'initiator cannot claim a remotely completed login without the callback browser receipt');
    assert.equal((await post('/api/auth/finish',cookie,{...attempt,receipt:'wrong'})).status,403);
    attempt.receipt=completed.receipt;
    assert.equal((await post('/api/auth/finish',null,attempt)).status,410,'different session cannot claim');
    assert.equal((await post('/api/auth/finish',cookie,{state:attempt.state,claim:'wrong'})).status,410,'claim secret required');
    const finish=await post('/api/auth/finish',cookie,attempt);assert.deepEqual(await finish.json(),{pending:false});
    const signedCookie=finish.headers.get('set-cookie').split(';')[0];
    assert.notEqual(signedCookie,cookie,'session rotates after login');
    assert.deepEqual(await (await fetch(base+'/me',{headers:{Cookie:signedCookie}})).json(),{user:id});
    assert.equal((await post('/api/auth/finish',cookie,attempt)).status,410,'claim consumed once');
    assert.equal((await fetch(base+'/callback?state=wrong&code=fake')).status,400);
    const sharedStart=await post('/api/auth/start');const shared=await sharedStart.json();states.push(shared.state);
    const sharedCookie=sharedStart.headers.get('set-cookie').split(';')[0];
    const sharedCallback=await fetch(base+'/callback?'+new URLSearchParams({state:shared.state,code:shared.state}),{headers:{Cookie:sharedCookie}});
    assert.equal((await sharedCallback.json()).success,true);
    const restoredCookie=sharedCallback.headers.get('set-cookie').split(';')[0];
    assert.notEqual(restoredCookie,sharedCookie);
    assert.deepEqual(await (await fetch(base+'/me',{headers:{Cookie:restoredCookie}})).json(),{user:id},'shared Chrome session is signed in before the return window closes');
    assert.equal((await db.query('SELECT state FROM app_login_attempts WHERE state=$1',[shared.state])).rowCount,0);
    const cancelledStart=await post('/api/auth/start');const cancelled=await cancelledStart.json();states.push(cancelled.state);
    const cancelledCookie=cancelledStart.headers.get('set-cookie').split(';')[0];
    assert.deepEqual(await (await fetch(base+'/callback?'+new URLSearchParams({state:cancelled.state,error:'access_denied'}))).json(),{success:false});
    assert.equal((await post('/api/auth/finish',cancelledCookie,cancelled)).status,400);
    await db.query("UPDATE app_login_attempts SET expires=NOW()-INTERVAL '1 second' WHERE state=$1",[cancelled.state]);
    assert.equal((await post('/api/auth/finish',cancelledCookie,cancelled)).status,410);
  } finally {
    if(server)await new Promise(resolve=>server.close(resolve));
    await db.query('DELETE FROM app_login_attempts WHERE state=ANY($1::text[])',[states]);
    await db.query('DELETE FROM users WHERE id=$1',[id]);await db.end();
  }
});
