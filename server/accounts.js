// All account removal runs in one transaction so foreign-key dependencies cannot
// leave a partially deleted account. Only the authenticated user's ID is used.
export function registerAccounts(app,{pool,asyncRoute}) {
  const accountAuth=asyncRoute(async(req,res,next)=>{
    if(!req.session.user)return res.status(401).json({error:'Sign in with Google first'});
    const {rows}=await pool.query('SELECT id,email FROM users WHERE id=$1',[req.session.user]);
    if(!rows[0])return res.status(401).json({error:'Account unavailable'});
    req.user=rows[0];next();
  });
  app.get('/api/account',accountAuth,(req,res)=>res.json({user:req.user}));
  app.delete('/api/account',accountAuth,asyncRoute(async(req,res)=>{
    if(req.body?.confirmation!=='DELETE')return res.status(400).json({error:'Confirm account deletion first'});
    const db=await pool.connect();
    try {
      await db.query('BEGIN');
      await db.query('SELECT id FROM users WHERE id=$1 FOR UPDATE',[req.user.id]);
      const owned='SELECT id FROM listings WHERE owner=$1';
      const chats=`SELECT id FROM conversations WHERE buyer=$1 OR seller=$1 OR listing IN (${owned})`;
      await db.query(`DELETE FROM reports WHERE reporter=$1 OR listing IN (${owned}) OR conversation IN (${chats})`,[req.user.id]);
      await db.query(`DELETE FROM conversation_reads WHERE user_id=$1 OR conversation IN (${chats})`,[req.user.id]);
      await db.query(`DELETE FROM messages WHERE sender=$1 OR conversation IN (${chats})`,[req.user.id]);
      await db.query(`DELETE FROM conversations WHERE id IN (${chats})`,[req.user.id]);
      await db.query(`DELETE FROM favourites WHERE owner=$1 OR listing IN (${owned})`,[req.user.id]);
      await db.query('UPDATE renewals SET reviewer=NULL WHERE reviewer=$1',[req.user.id]);
      await db.query(`DELETE FROM renewals WHERE owner=$1 OR listing IN (${owned})`,[req.user.id]);
      await db.query('DELETE FROM user_blocks WHERE blocker=$1 OR blocked=$1',[req.user.id]);
      await db.query('DELETE FROM listings WHERE owner=$1',[req.user.id]);
      await db.query('DELETE FROM photos WHERE owner=$1',[req.user.id]);
      await db.query("DELETE FROM session WHERE sess->>'user'=$1",[req.user.id]);
      await db.query('DELETE FROM users WHERE id=$1',[req.user.id]);
      await db.query('COMMIT');
    } catch(err) {
      await db.query('ROLLBACK');
      throw err;
    } finally {db.release()}
    req.session.destroy(()=>{
      res.clearCookie('connect.sid',{path:'/'});
      res.json({ok:true});
    });
  }));
  app.get('/delete-account',(req,res)=>res.type('html').send(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Delete your account — KosRent</title>
<link rel="stylesheet" href="/account-deletion.css"><script src="/account-deletion.js" defer></script></head>
<body><main><a href="/">← KosRent</a><h1>Delete your KosRent account</h1>
<p>You can delete your account here, including without the Android app installed. Sign in with the Google account you use for KosRent.</p>
<p>This permanently removes your account, listings, uploaded photos, saved homes, reports, payment-reference records, and conversations involving you, including messages sent by either participant. Other users' accounts and unrelated listings are kept. It does not delete your Google account.</p>
<p>Copies already saved by others cannot be recalled. Hosting backups may retain copies until they are rotated; they are not removed by this action. Contact the operator using the contact on our <a href="/legal/privacy">Privacy Notice</a> for backup, access or other data requests.</p>
<p id="status" role="status">Checking your sign-in…</p><a id="signin" href="/auth/google?returnTo=delete-account" hidden>Continue with Google, then return to this page</a>
<form id="deletion" hidden><label><input id="confirm" type="checkbox" required> I understand this permanently deletes my KosRent account and data.</label><button type="submit">Delete my account permanently</button></form>
<a href="/">Keep my account and return home</a></main></body></html>`));
}
