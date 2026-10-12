export const ANDROID_PACKAGE='in.co.vedtechnologies.kosrent';

export function androidAssetLinks(value) {
  const fingerprints=(value||'').split(',').map(s=>s.trim().toUpperCase()).filter(Boolean);
  if(fingerprints.some(s=>!/^([0-9A-F]{2}:){31}[0-9A-F]{2}$/.test(s)))throw Error('ANDROID_SHA256_FINGERPRINTS must contain comma-separated SHA-256 certificate fingerprints');
  return fingerprints.length?[{relation:['delegate_permission/common.handle_all_urls'],target:{namespace:'android_app',package_name:ANDROID_PACKAGE,sha256_cert_fingerprints:[...new Set(fingerprints)]}}]:[];
}

export function registerAndroid(app) {
  const links=androidAssetLinks(process.env.ANDROID_SHA256_FINGERPRINTS);
  // Google's Play App Signing certificate is available only after Play enrollment.
  // Do not claim domain verification with a made-up or upload-only certificate.
  app.get('/.well-known/assetlinks.json',(req,res)=>{
    res.set('Cache-Control','public, max-age=300');
    res.status(links.length?200:404).json(links);
  });
}
