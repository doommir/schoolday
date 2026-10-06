// Owner-approved September 30, 2026. Prices verified in the NovaPath live account.
// Routing new checkouts does not edit Stripe subscriptions or their renewal prices.
export function currentBillingCatalog<T extends {accountId:string;mode:string;familyPrice:string;prices:Record<string,any>;legacyFamilyPrice?:any;familyPortalId?:string}>(catalog:T):T {
 if(catalog.accountId!=='acct_1SdL3tBFJkum4Hif'||catalog.mode!=='live'||catalog.familyPrice!=='price_1UDSzrBFJkum4Hify0XWlWmj')return catalog;
 const old=catalog.prices.family;
 if(old?.id!==catalog.familyPrice||old.amount!==2900||old.product!=='prod_VDupO8mgcKj5Rt'||old.currency!=='usd'||old.interval!=='month'||old.intervalCount!==1)return catalog;
 const id='price_1ULQlcBFJkum4Hifdnw3r5I7';
 return {...catalog,familyPortalId:'bpc_1ULQq1BFJkum4HifiOdK0m72',familyPrice:id,legacyFamilyPrice:old,prices:{...catalog.prices,family:{...old,id,amount:4900}}};
}
