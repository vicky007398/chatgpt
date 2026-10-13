import {randomBytes} from 'node:crypto';

const save=req=>new Promise((resolve,reject)=>req.session.save(e=>e?reject(e):resolve()));
const regenerate=req=>new Promise((resolve,reject)=>req.session.regenerate(e=>e?reject(e):resolve()));

// Google Identity Services returns the credential to the app that requested it.
// Never authenticate from a browser message alone: verify Google's signature,
// audience and the nonce belonging to this app session on the server.
export function registerIdentityLogin(app,{pool,oauth,asyncRoute,adminEmails,clientId}) {
  app.post('/api/auth/identity/start',asyncRoute(async(req,res)=>{
    const nonce=randomBytes(32).toString('base64url');
    req.session.identityLogin={nonce,expires:Date.now()+5*60*1000};
    await save(req);
    res.set('Cache-Control','no-store').json({clientId,nonce});
  }));
  app.post('/api/auth/identity/finish',asyncRoute(async(req,res)=>{
    const attempt=req.session.identityLogin;
    if(!attempt||attempt.expires<Date.now())return res.status(401).json({error:'Sign-in expired. Please try again.'});
    const credential=req.body?.credential;
    if(typeof credential!=='string'||credential.length>16000)return res.status(400).json({error:'Invalid Google credential'});
    let p;
    try {
      const ticket=await oauth.verifyIdToken({idToken:credential,audience:clientId});
      p=ticket.getPayload();
      if(!p||p.email_verified!==true||p.nonce!==attempt.nonce||typeof p.sub!=='string'||typeof p.email!=='string')throw Error('Invalid identity');
    } catch {return res.status(401).json({error:'Google sign-in could not be verified. Please try again.'});}
    const existing=await pool.query('SELECT blocked FROM users WHERE id=$1',[p.sub]);
    if(existing.rows[0]?.blocked)return res.status(403).json({error:'Account unavailable'});
    await pool.query('INSERT INTO users(id,email,name) VALUES($1,$2,$3) ON CONFLICT(id) DO UPDATE SET email=$2,name=$3',[p.sub,p.email,p.name||p.email]);
    await regenerate(req);
    req.session.user=p.sub;
    req.session.admin=adminEmails().has(p.email.toLowerCase());
    await save(req);
    res.set('Cache-Control','no-store').json({signedIn:true});
  }));
}
