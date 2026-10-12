import test from 'node:test';
import assert from 'node:assert/strict';
import {requestOriginAllowed} from '../server/request-origin.js';
const origin='https://kosrent.vedtechnologies.co.in';
const request=(headers={},method='POST')=>({method,get:name=>headers[name.toLowerCase()]});
test('origin guard supports marked same-site browser requests while rejecting CSRF',()=>{
 assert.equal(requestOriginAllowed(request({origin}),origin),true);
 assert.equal(requestOriginAllowed(request({'x-kosrent-request':'1','sec-fetch-site':'same-origin'}),origin),true);
 assert.equal(requestOriginAllowed(request({origin:'null','x-kosrent-request':'1','sec-fetch-site':'same-origin'}),origin),true);
 assert.equal(requestOriginAllowed(request({origin:'null','x-kosrent-request':'1'}),origin),true,'browser with no Fetch Metadata still needs the custom header');
 for(const headers of [{},{origin:'null'},{origin:'https://evil.example'},{origin:'https://evil.example','x-kosrent-request':'1'},{'sec-fetch-site':'cross-site','x-kosrent-request':'1'},{origin:'null','sec-fetch-site':'cross-site','x-kosrent-request':'1'},{origin:origin+'/', 'x-kosrent-request':'1'}]){
  assert.equal(requestOriginAllowed(request(headers),origin),false,JSON.stringify(headers));
 }
 assert.equal(requestOriginAllowed(request({},'GET'),origin),true);
});
