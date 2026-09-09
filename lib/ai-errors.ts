// Never show the provider's raw message: it can echo credentials or input text.
export function providerFailure(status:number,body:unknown,requestId:string|null,web:boolean){
 const error=body&&typeof body==='object'&&'error'in body?(body as {error:unknown}).error:null;
 const e=error&&typeof error==='object'?error as Record<string,unknown>:{};
 const code=typeof e.code==='string'?e.code:'';
 const parameter=typeof e.param==='string'?e.param:'';
 const message=typeof e.message==='string'?e.message.toLowerCase():'';
 let detail='OpenAI rejected the request. Check the API project’s model and tool permissions.';
 if(status===401)detail='OpenAI rejected the API key. Save a valid replacement key in AI settings.';
 else if(status===403)detail='This API project does not have permission for the requested model or capability. Check project permissions and any required organization verification.';
 else if(code==='insufficient_quota'||code==='billing_hard_limit_reached')detail='The OpenAI API project has no available quota. Check API billing, credits and spending limits; a ChatGPT subscription does not fund API usage.';
 else if(status===429)detail='OpenAI is rate limiting this project. Wait before retrying and check the project’s API limits.';
 else if(code==='model_not_found'||status===404)detail='The configured model is unavailable to this API project. Check the exact model ID and project access in AI settings.';
 else if(status>=500)detail='OpenAI is temporarily unavailable. Your saved preparation step is retained; retry later.';
 else if(status===400||status===422){
  if(parameter.startsWith('text.format')||code==='invalid_json_schema')detail='OpenAI rejected the structured-output schema. The app request needs correction; changing the key will not repair the schema.';
  else if(parameter.startsWith('tools')||parameter==='tool_choice'||message.includes('web_search'))detail='OpenAI rejected the web-search tool configuration. Check that the selected model supports Responses web search and that the project permits it.';
  else detail='OpenAI rejected a request setting. Check that the selected model supports Responses and '+(web?'web search.':'structured outputs.')+' The app request may need correction.';
 }
 const safeParameter=/^(tools(?:\[0\]|\.0)?(?:\.type|\.filters(?:\.allowed_domains)?)?|tool_choice(?:\.type)?|model|text\.format(?:\.schema)?)$/.test(parameter)?' Request field: '+parameter+'.':'';
 const reference=requestId&&/^req_[a-zA-Z0-9_-]{1,100}$/.test(requestId)?' Reference: '+requestId+'.':'';
 return {status:status===429?429:status===401||status===403?503:502,message:detail+' (OpenAI HTTP '+status+').'+safeParameter+reference};
}

// Retry only an explicitly unsupported tool, never authorization or billing failures.
export function legacySearchEligible(status:number,body:unknown){
 if(status!==400||!body||typeof body!=='object'||!('error' in body))return false;
 const e=(body as {error:Record<string,unknown>}).error;
 if(!e||typeof e!=='object')return false;
 const m=typeof e.message==='string'?e.message.toLowerCase():'';
 return /web_search(?!_preview)/.test(m)&&/not supported|unsupported|invalid value|unknown tool/.test(m)&&!(/permission|not allowed|verification|filters|allowed_domains/.test(m));
}
