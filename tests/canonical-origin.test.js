import test from 'node:test';
import assert from 'node:assert/strict';
import {canonicalOrigin} from '../server/canonical-origin.js';

test('old app navigation and sign-in use the fixed public origin while service endpoints remain available',()=>{
  const middleware=canonicalOrigin('https://kosrent.vedtechnologies.co.in');
  function request(path,host='older-app.up.railway.app',method='GET'){
    let redirect,next=false;
    const req={method,path:path.split('?')[0],originalUrl:path,get:name=>name==='host'?host:name==='sec-fetch-mode'?'navigate':undefined};
    const res={set(){return this;},redirect(status,url){redirect={status,url};}};
    middleware(req,res,()=>next=true);return {redirect,next};
  }
  assert.equal(request('/').redirect.url,'https://kosrent.vedtechnologies.co.in/');
  assert.equal(request('/auth/google?popup=1').redirect.url,'https://kosrent.vedtechnologies.co.in/auth/google?popup=1');
  assert.equal(request('/?listing=sample').redirect.url,'https://kosrent.vedtechnologies.co.in/?listing=sample');
  assert.equal(new URL(request('//attacker.example').redirect.url).origin,'https://kosrent.vedtechnologies.co.in','request paths cannot select an external redirect host');
  assert.equal(request('/','kosrent.vedtechnologies.co.in').next,true);
  assert.equal(request('/api/health').next,true);
  assert.equal(request('/api/auth/identity/start',undefined,'POST').next,true);
  assert.equal(request('/.well-known/assetlinks.json').next,true);
});
