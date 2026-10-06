import test from 'node:test';
import assert from 'node:assert/strict';
import {currentBillingCatalog} from '../lib/pricing.ts';
const old={id:'price_1UDSzrBFJkum4Hify0XWlWmj',product:'prod_VDupO8mgcKj5Rt',amount:2900,currency:'usd',interval:'month',intervalCount:1,livemode:true};
const config={accountId:'acct_1SdL3tBFJkum4Hif',mode:'live',familyPrice:old.id,portalId:'existing-portal',prices:{family:old}};
test('new purchase routing retains legacy price and does not mutate stored configuration',()=>{
 const changed=currentBillingCatalog(config);
 assert.equal(changed.prices.family.amount,4900);
 assert.equal(changed.familyPrice,'price_1ULQlcBFJkum4Hifdnw3r5I7');
 assert.equal(changed.legacyFamilyPrice.amount,2900);
 assert.equal(changed.portalId,'existing-portal');
 assert.equal(changed.familyPortalId,'bpc_1ULQq1BFJkum4HifiOdK0m72');
 assert.equal(config.prices.family.amount,2900);
 assert.deepEqual(currentBillingCatalog(changed),changed);
});
test('routing cannot change another Stripe account, test mode, or an unrecognized price',()=>{
 for(const c of [{...config,accountId:'another-account'},{...config,mode:'test'},{...config,familyPrice:'different-price'},{...config,prices:{family:{...old,amount:3900}}}])assert.equal(currentBillingCatalog(c),c);
});
