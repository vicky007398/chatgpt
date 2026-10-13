import {randomBytes,createHash} from 'node:crypto';

const token=()=>randomBytes(32).toString('base64url');
const hash=value=>createHash('sha256').update(value).digest('hex');
const save=req=>new Promise((resolve,reject)=>req.session.save(e=>e?reject(e):resolve()));
const regenerate=req=>new Promise((resolve,reject)=>req.session.regenerate(e=>e?reject(e):resolve()));

// Bind login to the initiating app session. The Google browser window may use
// a different cookie jar, but cannot claim a login on behalf of another app.
export async function registerAppLogin(app,{pool,oauth,asyncRoute,returnPage,adminEmails}) {
  await pool.query(`CREATE TABLE IF NOT EXISTS app_login_attempts(
    state TEXT PRIMARY KEY,session_id TEXT NOT NULL,claim_hash TEXT NOT NULL,
    verifier TEXT NOT NULL,nonce TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending',
    profile JSONB,expires TIMESTAMPTZ NOT NULL DEFAULT NOW()+INTERVAL '10 minutes');
    CREATE INDEX IF NOT EXISTS app_login_attempts_expiry ON app_login_attempts(expires)`);
  const cleanup=setInterval(()=>pool.query('DELETE FROM app_login_attempts WHERE expires<NOW()').catch(()=>{}),60000);
  cleanup.unref();
  app.post('/api/auth/start',asyncRoute(async(req,res)=>{
    const state=token(),claim=token(),verifier=token(),nonce=token();
    req.session.appLogin=true;
    await save(req);
    await pool.query('DELETE FROM app_login_attempts WHERE expires<NOW()');
    await pool.query('INSERT INTO app_login_attempts(state,session_id,claim_hash,verifier,nonce) VALUES($1,$2,$3,$4,$5)',[state,req.sessionID,hash(claim),verifier,nonce]);
    const url=oauth.generateAuthUrl({scope:['openid','email','profile'],state,nonce,code_challenge:createHash('sha256').update(verifier).digest('base64url'),code_challenge_method:'S256'});
    res.set('Cache-Control','no-store').json({state,claim,url});
  }));
  app.post('/api/auth/finish',asyncRoute(async(req,res)=>{
    const {state,claim}=req.body||{};
    if(typeof state!=='string'||typeof claim!=='string'||state.length>100||claim.length>100)return res.status(400).json({error:'Invalid sign-in attempt'});
    const {rows}=await pool.query('SELECT status FROM app_login_attempts WHERE state=$1 AND session_id=$2 AND claim_hash=$3 AND expires>NOW()',[state,req.sessionID,hash(claim)]);
    if(!rows[0])return res.status(410).json({error:'Sign-in expired. Please try again.'});
    if(rows[0].status==='failed')return res.status(400).json({error:'Google sign-in was interrupted. Please try again.'});
    if(rows[0].status!=='complete')return res.json({pending:true});
    const claimed=await pool.query("DELETE FROM app_login_attempts WHERE state=$1 AND session_id=$2 AND claim_hash=$3 AND status='complete' AND expires>NOW() RETURNING profile",[state,req.sessionID,hash(claim)]);
    if(!claimed.rows[0])return res.status(410).json({error:'Sign-in already completed. Please try again.'});
    const p=claimed.rows[0].profile;
    await pool.query('INSERT INTO users(id,email,name) VALUES($1,$2,$3) ON CONFLICT(id) DO UPDATE SET email=$2,name=$3',[p.sub,p.email,p.name]);
    await regenerate(req);
    req.session.user=p.sub;
    req.session.admin=adminEmails().has(p.email.toLowerCase());
    await save(req);
    res.set('Cache-Control','no-store').json({pending:false});
  }));
  return async(req,res)=>{
    if(typeof req.query.state!=='string')return false;
    const {rows}=await pool.query('SELECT * FROM app_login_attempts WHERE state=$1 AND expires>NOW()',[req.query.state]);
    if(!rows[0])return false;
    const attempt=rows[0];
    const locked=await pool.query("UPDATE app_login_attempts SET status='exchanging' WHERE state=$1 AND status='pending' AND expires>NOW() RETURNING state",[attempt.state]);
    if(!locked.rowCount){returnPage(res,attempt.status==='complete');return true;}
    try {
      if(typeof req.query.code!=='string'||req.query.error)throw Error('Google sign-in cancelled');
      const {tokens}=await oauth.getToken({code:req.query.code,codeVerifier:attempt.verifier});
      const ticket=await oauth.verifyIdToken({idToken:tokens.id_token,audience:process.env.GOOGLE_CLIENT_ID});
      const p=ticket.getPayload();
      if(p.email_verified!==true||p.nonce!==attempt.nonce||typeof p.sub!=='string'||typeof p.email!=='string')throw Error('Invalid verified Google identity');
      await pool.query("UPDATE app_login_attempts SET status='complete',profile=$2,verifier='',nonce='' WHERE state=$1",[attempt.state,{sub:p.sub,email:p.email,name:p.name||p.email}]);
      returnPage(res,true);
    } catch {
      await pool.query("UPDATE app_login_attempts SET status='failed',verifier='',nonce='' WHERE state=$1",[attempt.state]);
      returnPage(res,false);
    }
    return true;
  };
}
