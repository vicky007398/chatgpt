import test from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import signature from 'cookie-signature';
import {randomUUID} from 'node:crypto';
const url=process.env.TEST_APP_URL,secret=process.env.TEST_SESSION_SECRET;
test('analytics counts visible signed-in users once and protects admin aggregates',async()=>{
 assert.ok(process.env.TEST_DATABASE_URL&&url&&secret,'Use isolated TEST_* settings');
 const db=new pg.Pool({connectionString:process.env.TEST_DATABASE_URL});
 const admin=randomUUID(),user=randomUUID(),hidden=randomUUID();const cookies={};
 async function request(path,who,visible='1'){
  const response=await fetch(url+'/api'+path,{headers:{...(who?{Cookie:cookies[who]}:{}),'X-KosRent-Visible':visible}});
  return {status:response.status,data:await response.json(),cookie:response.headers.get('set-cookie')};
 }
 try{
  await fetch(url+'/auth/google',{redirect:'manual'});
  await db.query('INSERT INTO users(id,email,name,created) VALUES($1,$2,$3,NOW())',[admin,'integration-admin@example.com','Admin']);
  for(const id of [user,hidden])await db.query('INSERT INTO users(id,email,name) VALUES($1,$2,$3)',[id,id+'@example.com','Test user']);
  for(const id of [admin,user,hidden]){
   const sid=randomUUID();await db.query("INSERT INTO session(sid,sess,expire) VALUES($1,$2,NOW()+INTERVAL '1 hour')",[sid,{cookie:{originalMaxAge:3600000,httpOnly:true,secure:false,sameSite:'lax'},user:id}]);
   cookies[id]='connect.sid='+encodeURIComponent('s:'+signature.sign(sid,secret));
  }
  assert.equal((await request('/admin/analytics')).status,401);
  assert.equal((await request('/admin/analytics',user)).status,403);
  await request('/me',hidden,'0');
  assert.equal((await db.query('SELECT * FROM user_activity WHERE user_id=$1',[hidden])).rowCount,0,'background traffic excluded');
  await request('/me',user);await request('/me',user);
  assert.equal((await db.query('SELECT * FROM user_activity WHERE user_id=$1',[user])).rowCount,1,'repeated requests are deduplicated');
  const today=(await db.query("SELECT (NOW() AT TIME ZONE 'Asia/Kolkata')::date::text AS day")).rows[0].day;
  await db.query('INSERT INTO user_activity(user_id,day) VALUES($1,$2::date-6),($1,$2::date-29),($3,$2::date-90)',[user,today,hidden]);
  const result=await request('/admin/analytics',admin);assert.equal(result.status,200);
  assert.equal(result.data.timezone,'Asia/Kolkata');assert.equal(result.data.daily.length,30);
  assert.equal(result.data.daily.at(-1).day,today);
  assert.equal(result.data.daily.at(-1).active_users,result.data.summary.active_today);
  for(const [name,offset] of [['active_7_days',6],['active_30_days',29]]){
   const expected=(await db.query('SELECT COUNT(DISTINCT user_id)::int AS n FROM user_activity WHERE day BETWEEN $1::date-$2::int AND $1::date',[today,offset])).rows[0].n;
   assert.equal(result.data.summary[name],expected);
  }
  assert.equal((await db.query('SELECT * FROM user_activity WHERE user_id=$1 AND day=$2::date-90',[hidden,today])).rowCount,0,'expired records removed');
  assert.ok(!JSON.stringify(result.data).includes('integration-admin@example.com'),'aggregates omit identities');
  await db.query('DELETE FROM session WHERE sess->>\'user\'=$1',[user]);await db.query('DELETE FROM users WHERE id=$1',[user]);
  assert.equal((await db.query('SELECT * FROM user_activity WHERE user_id=$1',[user])).rowCount,0,'deletion removes activity');
 }finally{
  for(const id of [admin,user,hidden]){await db.query("DELETE FROM session WHERE sess->>'user'=$1",[id]);await db.query('DELETE FROM users WHERE id=$1',[id])}
  await db.end();
 }
});
