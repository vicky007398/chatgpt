// Browser scripts cannot send our custom header across sites without a CORS
// preflight. This application does not grant credentialed cross-origin access.
// Keep rejecting explicit foreign origins, including when the marker is present.
export function requestOriginAllowed(req,expectedOrigin) {
  if(['GET','HEAD','OPTIONS'].includes(req.method))return true;
  const source=req.get('Origin');
  if(source&&source!=='null')return source===expectedOrigin;
  if(req.get('Sec-Fetch-Site')==='cross-site')return false;
  return req.get('X-KosRent-Request')==='1';
}

export function protectRequestOrigin(origin) {
  return (req,res,next)=>{
    if(!requestOriginAllowed(req,origin))return res.status(403).json({error:'Invalid request origin'});
    next();
  };
}
