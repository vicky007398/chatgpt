import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {androidAssetLinks,ANDROID_PACKAGE} from '../server/android.js';

test('Android website verification requires real certificates and matches the app package',()=>{
  assert.deepEqual(androidAssetLinks(),[]);
  assert.throws(()=>androidAssetLinks('PLACEHOLDER'),/SHA-256/);
  const cert=Array(32).fill('AB').join(':');
  const links=androidAssetLinks(cert.toLowerCase()+', '+cert);
  assert.equal(links[0].target.package_name,ANDROID_PACKAGE);
  assert.deepEqual(links[0].target.sha256_cert_fingerprints,[cert]);
  assert.equal(JSON.parse(readFileSync(new URL('../android/twa-manifest.json',import.meta.url))).packageId,ANDROID_PACKAGE);
});
