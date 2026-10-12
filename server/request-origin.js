// Browser scripts cannot send our custom header across sites without a CORS
// preflight. This application does not grant credentialed cross-origin access.
// Fetch Metadata is browser-controlled: scripts cannot forge Sec-Fetch-Site.
// Recognise the existing visibility header so already-open app versions work too.
export function requestOriginAllowed(req,expectedOrigin) {
  if(['GET','HEAD','OPTIONS'].includes(req.method))return true;
  const source=req.get('Origin');
  const site=req.get('Sec-Fetch-Site');
  if(site==='cross-site')return false;
  const marked=req.get('X-KosRent-Request')==='1'||['0','1'].includes(req.get('X-KosRent-Visible'));
  // Browser-controlled same-origin metadata also supports older installed pages
  // that predate our custom headers, without trusting another website.
  if(site==='same-origin')return true;
  if(source&&source!=='null')return source===expectedOrigin;
  return marked;
}

export function protectRequestOrigin(origin) {
  return (req,res,next)=>{
    if(!requestOriginAllowed(req,origin))return res.status(403).json({error:'Invalid request origin'});
    next();
  };
}
