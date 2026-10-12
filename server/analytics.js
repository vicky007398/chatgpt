const timezone='Asia/Kolkata';
const indiaDay=()=>new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());

export async function registerAnalytics(app,{pool,auth,admin,asyncRoute}) {
  // Preserve unknown historical registration dates instead of inventing them.
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS created TIMESTAMPTZ;
    ALTER TABLE users ALTER COLUMN created SET DEFAULT NOW();
    CREATE INDEX IF NOT EXISTS users_created ON users(created);
    CREATE INDEX IF NOT EXISTS listings_created ON listings(created);
    CREATE INDEX IF NOT EXISTS messages_created ON messages(created);
    CREATE TABLE IF NOT EXISTS analytics_state(id INTEGER PRIMARY KEY CHECK(id=1),started TIMESTAMPTZ NOT NULL DEFAULT NOW());
    INSERT INTO analytics_state(id) VALUES(1) ON CONFLICT DO NOTHING;
    CREATE TABLE IF NOT EXISTS user_activity(user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,day DATE NOT NULL,PRIMARY KEY(user_id,day));
    CREATE INDEX IF NOT EXISTS user_activity_day ON user_activity(day);`);

  const prune=()=>pool.query("DELETE FROM user_activity WHERE day < (NOW() AT TIME ZONE 'Asia/Kolkata')::date - 89");
  await prune();
  const cleanup=setInterval(()=>prune().catch(err=>console.error('Activity cleanup failed:',err.code||err.name)),60*60*1000);
  cleanup.unref();

  // Reuse the essential login session; no guest identifiers or extra cookies.
  app.use('/api',async(req,res,next)=>{
    const day=indiaDay();
    if(req.get('X-KosRent-Visible')==='1'&&req.session.user&&req.session.analyticsDay!==day){
      try {
        const recorded=await pool.query(`INSERT INTO user_activity(user_id,day) SELECT id,$2::date FROM users WHERE id=$1 AND NOT blocked ON CONFLICT (user_id,day) DO UPDATE SET day=EXCLUDED.day`,[req.session.user,day]);
        if(recorded.rowCount)req.session.analyticsDay=day;
        await pool.query("DELETE FROM user_activity WHERE day < $1::date - 89",[day]);
      }catch(err){console.error('Activity recording failed:',err.code||err.name)}
    }
    next();
  });

  app.get('/api/admin/analytics',auth,admin,asyncRoute(async(req,res)=>{
    const day=indiaDay();
    const summary=await pool.query(`SELECT
      (SELECT COUNT(*)::int FROM users) AS users,
      (SELECT COUNT(*)::int FROM users WHERE created IS NULL) AS unknown_registration_dates,
      (SELECT COUNT(DISTINCT user_id)::int FROM user_activity WHERE day=$1::date) AS active_today,
      (SELECT COUNT(DISTINCT user_id)::int FROM user_activity WHERE day BETWEEN $1::date-6 AND $1::date) AS active_7_days,
      (SELECT COUNT(DISTINCT user_id)::int FROM user_activity WHERE day BETWEEN $1::date-29 AND $1::date) AS active_30_days,
      (SELECT COUNT(*)::int FROM users WHERE (created AT TIME ZONE 'Asia/Kolkata')::date BETWEEN $1::date-29 AND $1::date) AS signups_30_days,
      (SELECT COUNT(*)::int FROM listings) AS listings,
      (SELECT COUNT(*)::int FROM listings WHERE status='approved' AND data->>'purpose'='rent' AND lower(trim(data->>'village'))='kosamba') AS available_listings,
      (SELECT COUNT(*)::int FROM listings WHERE status='rented') AS rented_listings,
      (SELECT COUNT(*)::int FROM conversations) AS conversations,
      (SELECT COUNT(*)::int FROM messages) AS messages,
      (SELECT started FROM analytics_state WHERE id=1) AS tracking_started`,[day]);
    const daily=await pool.query(`WITH dates AS (SELECT generate_series($1::date-29,$1::date,'1 day')::date AS day),
      activity AS (SELECT day,COUNT(*)::int AS active_users FROM user_activity WHERE day BETWEEN $1::date-29 AND $1::date GROUP BY day),
      signups AS (SELECT (created AT TIME ZONE 'Asia/Kolkata')::date AS day,COUNT(*)::int AS signups FROM users WHERE created >= (($1::date-29)::timestamp AT TIME ZONE 'Asia/Kolkata') GROUP BY 1),
      homes AS (SELECT (created AT TIME ZONE 'Asia/Kolkata')::date AS day,COUNT(*)::int AS listings FROM listings WHERE created >= (($1::date-29)::timestamp AT TIME ZONE 'Asia/Kolkata') GROUP BY 1),
      chats AS (SELECT (created AT TIME ZONE 'Asia/Kolkata')::date AS day,COUNT(*)::int AS messages FROM messages WHERE created >= (($1::date-29)::timestamp AT TIME ZONE 'Asia/Kolkata') GROUP BY 1)
      SELECT to_char(d.day,'YYYY-MM-DD') AS day,COALESCE(a.active_users,0) AS active_users,COALESCE(s.signups,0) AS signups,COALESCE(h.listings,0) AS listings,COALESCE(c.messages,0) AS messages
      FROM dates d LEFT JOIN activity a USING(day) LEFT JOIN signups s USING(day) LEFT JOIN homes h USING(day) LEFT JOIN chats c USING(day) ORDER BY d.day`,[day]);
    res.set('Cache-Control','no-store').json({timezone,today:day,summary:summary.rows[0],daily:daily.rows});
  }));
}
