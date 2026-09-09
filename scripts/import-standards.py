"""Import identifiers/metadata only from CDE. Official wording is fetched into each lesson's audit snapshot at generation time."""
import urllib.request,re,html,json,concurrent.futures,pathlib
ROOT=pathlib.Path(__file__).resolve().parents[1]
BASE='https://www2.cde.ca.gov'
def clean(s):return re.sub(r'\s+',' ',html.unescape(re.sub('<[^>]*>',' ',s))).strip()
def get(item):
 name,page=item
 u=f'{BASE}/cacs/{name}?mingrade=6&maxgrade=8&perpage=100&page={page}'
 cache=pathlib.Path('/tmp')/f'cde-import-{name}-{page}.html'
 s=cache.read_text() if cache.exists() else urllib.request.urlopen(u,timeout=30).read().decode()
 cache.write_text(s)
 rows=[]
 for block in re.split(r'<h4[^>]*>',s)[1:]:
  m=re.search(r'<a href="(/cacs/id/web/\d+)">([^<]+)</a>',block)
  if not m:continue
  code=m[2].strip().rstrip('.').replace('–','-');text=clean(block)
  g=re.search(r'Grade: (6|7|8)\b',text)
  if name=='science':grades=[int(k) for k,v in mapping.items() if code in v]
  else:grades=[int(g[1])] if g else []
  if not grades:continue
  # Omit HSS parent aggregates; retain the assessable substandards.
  if name=='history' and len(code.split('.'))<3:continue
  label=re.search(r'(?:Domain|Course|Content Area):\s*<b>(.*?)</b>',block,re.S)
  for grade in grades:
   subjects=['Math'] if name=='math' else ['Science'] if name=='science' else ['Humanities'] if name=='history' else ['Literacy']+(['Studio'] if code.startswith('W.') else [])
   for subject in subjects:rows.append({'id':code,'grade':grade,'subject':subject,'domain':clean(label[1]) if label else name,'url':BASE+m[1],'verified':'2026-09-08',**({'courseUrl':science_urls[str(grade)]} if name=='science' else {})})
 return rows
mapping=json.loads((ROOT/'data/california-science-grade-map.json').read_text())
science_urls={'6':'https://www.cde.ca.gov/ci/pl/documents/cangsspfintegrgr6.pdf','7':'https://www.cde.ca.gov/ci/pl/documents/preferredintegratedgr7.pdf','8':'https://www.cde.ca.gov/ci/pl/documents/preferredintegratedgr8.pdf'}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
 groups=list(pool.map(get,[('math',0),('math',1),('math',2),('math',3),('ela',0),('ela',1),('history',0),('history',1),('history',2),('science',0)]))
rows=[r for group in groups for r in group];keys=[(r['id'],r['grade'],r['subject']) for r in rows];assert len(keys)==len(set(keys))
for g in (6,7,8):
 for s in ('Math','Literacy','Science','Humanities','Studio'):
  n=sum(r['grade']==g and r['subject']==s for r in rows);assert n>0,(g,s);print(g,s,n)
(ROOT/'data/standards-catalog.json').write_text(json.dumps(rows,indent=2,ensure_ascii=False)+'\n')
