from pathlib import Path
from html.parser import HTMLParser
import re, subprocess, sqlite3
root=Path(__file__).resolve().parents[1]
class Parser(HTMLParser):
 def __init__(self):super().__init__();self.ids=set();self.links=[]
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if 'id' in a:
   assert a['id'] not in self.ids, f'Duplicate id: {a["id"]}'
   self.ids.add(a['id'])
  for key in ['src','href']:
   if key in a:self.links.append(a[key])
for html in (root/'docs').glob('*.html'):
 parser=Parser();parser.feed(html.read_text())
 for link in parser.links:
  if re.match(r'^(https?:|mailto:|tel:)',link):continue
  if link.startswith('#'):assert link[1:] in parser.ids, (html.name,link)
  else:assert (html.parent/link.split('#')[0]).exists(),(html.name,link)
 js=root/'docs'/('admin.js' if html.name=='admin.html' else 'app.js')
 for identifier in re.findall(r"\$\('#([\w-]+)'\)",js.read_text()):
  if identifier in ['quote-status-edit','save-quote-status','quote-update-status','quote-artifacts']:continue
  assert identifier in parser.ids,(js.name,identifier)
for path in list((root/'docs').glob('*.js'))+list((root/'backend').glob('*.mjs'))+list((root/'mail-relay').glob('*.mjs')):
 subprocess.run(['node','--check',str(path)],check=True)
conn=sqlite3.connect(':memory:');conn.executescript((root/'backend/schema.sql').read_text())
assert len(list((root/'docs/assets').glob('*.jpg')))==11
print('Passed: asset links, fragment targets, unique IDs, script element targets, JS syntax, and SQL schema.')
