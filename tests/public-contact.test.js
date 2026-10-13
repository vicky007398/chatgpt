import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import {registerBilling} from '../server/billing.js';
import {registerLegal} from '../server/legal.js';

test('public policies name Ved Technologies and do not disclose a correspondence address',async()=>{
  const previous={};
  for(const key of ['OPERATOR_NAME','SUPPORT_EMAIL','BUSINESS_ADDRESS'])previous[key]=process.env[key];
  process.env.OPERATOR_NAME='';process.env.SUPPORT_EMAIL='';
  process.env.BUSINESS_ADDRESS='Private correspondence fixture';
  const app=express();
  registerBilling(app,{pool:{},auth:(req,res,next)=>next(),admin:(req,res,next)=>next(),asyncRoute:fn=>fn});
  registerLegal(app);
  const server=app.listen(0,'127.0.0.1');
  try {
    await new Promise(resolve=>server.once('listening',resolve));
    const base='http://127.0.0.1:'+server.address().port;
    const config=await (await fetch(base+'/api/billing/config')).json();
    assert.equal(config.operator,'Ved Technologies');
    assert.equal(config.email,'rathodar110@gmail.com');assert.equal(config.enabled,false);
    assert.equal(config.address,undefined,'private business address is omitted from public configuration');
    for(const page of ['terms','privacy','refunds']){
      const response=await fetch(base+'/legal/'+page);assert.equal(response.status,200);
      const html=await response.text();
      assert.match(html,/Operator: Ved Technologies/);
      assert.match(html,/mailto:rathodar110@gmail.com/);
      assert.doesNotMatch(html,/Private correspondence fixture|Business address:|Not configured/);
    }
  } finally {
    await new Promise(resolve=>server.close(resolve));
    for(const [key,value] of Object.entries(previous)){if(value===undefined)delete process.env[key];else process.env[key]=value;}
  }
});
