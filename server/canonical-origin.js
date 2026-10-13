// An installed shortcut may still open an older hosting domain. OAuth cookies
// and Google's registered JavaScript origin must use the current public domain.
export function canonicalOrigin(origin) {
  const target=new URL(origin);
  return (req,res,next)=>{
    if(target.protocol!=='https:'||!['GET','HEAD'].includes(req.method)||req.path.startsWith('/api/')||req.path.startsWith('/.well-known/'))return next();
    const navigation=req.path==='/'||req.path.startsWith('/auth/')||req.get('sec-fetch-mode')==='navigate'||req.get('accept')?.includes('text/html');
    if(!navigation)return next();
    if(req.get('host')?.toLowerCase()===target.host.toLowerCase())return next();
    const url=new URL(target);
    url.pathname=req.path;
    const query=req.originalUrl.indexOf('?');
    if(query!==-1)url.search=req.originalUrl.slice(query);
    res.set('Cache-Control','no-store').redirect(302,url.href);
  };
}
