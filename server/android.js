export const ANDROID_PACKAGE='in.co.vedtechnologies.kosrent';
// Verified SHA-256 of the certificate signing the directly distributed APK.
// Play App Signing uses its own certificate, configured separately below.
export const DIRECT_APK_SHA256='2E:CE:9C:49:E4:19:7F:6D:15:F0:E8:66:69:DD:7A:22:23:F9:F6:9E:85:9B:8B:DE:2F:89:F0:25:EE:6D:8E:54';
// Public App signing key certificate SHA-256 from KosRent's Google Play Console.
export const PLAY_APP_SIGNING_SHA256='CC:BA:5D:53:F5:70:28:48:C1:2B:8C:BD:1A:DC:58:29:FE:FE:DF:01:75:10:A7:77:3B:3E:94:8F:10:09:E7:32';

export function androidAssetLinks(value) {
  const fingerprints=(value||'').split(',').map(s=>s.trim().toUpperCase()).filter(Boolean);
  if(fingerprints.some(s=>!/^([0-9A-F]{2}:){31}[0-9A-F]{2}$/.test(s)))throw Error('ANDROID_SHA256_FINGERPRINTS must contain comma-separated SHA-256 certificate fingerprints');
  return fingerprints.length?[{relation:['delegate_permission/common.handle_all_urls'],target:{namespace:'android_app',package_name:ANDROID_PACKAGE,sha256_cert_fingerprints:[...new Set(fingerprints)]}}]:[];
}

export function registerAndroid(app) {
  const links=androidAssetLinks([DIRECT_APK_SHA256,PLAY_APP_SIGNING_SHA256,process.env.ANDROID_SHA256_FINGERPRINTS].filter(Boolean).join(','));
  app.get('/.well-known/assetlinks.json',(req,res)=>{
    res.set('Cache-Control','public, max-age=300');
    res.status(links.length?200:404).json(links);
  });
}
