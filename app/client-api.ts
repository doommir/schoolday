export async function api(path:string, body?:unknown) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 120000);
  try {
    const response = await fetch('/api/' + path, {
      method:body === undefined ? 'GET' : 'POST',
      headers:body === undefined ? {} : {'Content-Type':'application/json'},
      body:body === undefined ? undefined : JSON.stringify(body), signal:controller.signal,
    });
    const data:any = await response.json().catch(() => null);
    if(!response.ok || !data) throw Error(data?.error || 'The connection was interrupted. Your saved work is safe; try this step again.');
    return data;
  } catch(error) {
    if(controller.signal.aborted) throw Error('This step is taking longer than expected. Retry to check its saved progress.');
    throw error;
  } finally {clearTimeout(timer);}
}
