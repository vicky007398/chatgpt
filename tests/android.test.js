import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,X509Certificate} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {androidAssetLinks,ANDROID_PACKAGE,DIRECT_APK_SHA256,PLAY_APP_SIGNING_SHA256,registerAndroid} from '../server/android.js';

test('Android website verification requires real certificates and matches the app package',()=>{
  assert.deepEqual(androidAssetLinks(),[]);
  assert.throws(()=>androidAssetLinks('PLACEHOLDER'),/SHA-256/);
  const cert=Array(32).fill('AB').join(':');
  const links=androidAssetLinks(cert.toLowerCase()+', '+cert);
  assert.equal(links[0].target.package_name,ANDROID_PACKAGE);
  assert.deepEqual(links[0].target.sha256_cert_fingerprints,[cert]);
  assert.equal(JSON.parse(readFileSync(new URL('../android/twa-manifest.json',import.meta.url))).packageId,ANDROID_PACKAGE);
});

test('Android domain association includes the direct and Play signing certificates',()=>{
  const certificate=new X509Certificate(readFileSync(new URL('../android/upload-certificate.pem',import.meta.url)));
  const fingerprint=createHash('sha256').update(certificate.raw).digest('hex').match(/.{2}/g).join(':').toUpperCase();
  assert.equal(DIRECT_APK_SHA256,fingerprint);
  let route,body,status;const app={get(path,handler){assert.equal(path,'/.well-known/assetlinks.json');route=handler;}};
  registerAndroid(app);
  const res={set(){return this;},status(value){status=value;return this;},json(value){body=value;}};
  route({},res);assert.equal(status,200);assert.ok(body[0].target.sha256_cert_fingerprints.includes(fingerprint));
  assert.ok(body[0].target.sha256_cert_fingerprints.includes(PLAY_APP_SIGNING_SHA256));
  assert.notEqual(PLAY_APP_SIGNING_SHA256,DIRECT_APK_SHA256);
});
