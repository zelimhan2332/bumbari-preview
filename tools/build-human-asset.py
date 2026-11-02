from pathlib import Path
import json,math
root=Path(__file__).resolve().parents[1]; assets=root/'preview/assets'
verts=[];faces=[];group=''
for line in (assets/'makehuman-base.obj').read_text().splitlines():
 if line.startswith('v '):verts.append(list(map(float,line.split()[1:4])))
 elif line.startswith('g '):group=line[2:]
 elif line.startswith('f ') and group=='body':
  face=[int(x.split('/')[0])-1 for x in line.split()[1:]]
  for n in range(1,len(face)-1):faces.append([face[0],face[n],face[n+1]])
for name in ['african-female-young','asian-female-young','caucasian-female-young','universal-female-young-averagemuscle-averageweight']:
 for line in (assets/(name+'.target')).read_text().splitlines():
  if not line or line.startswith('#'):continue
  a=line.split();idx=int(a[0]);delta=list(map(float,a[1:4]))
  for k in range(3):verts[idx][k]+=delta[k] * (1 if name.startswith('universal-') else 1/3)
used=sorted({i for f in faces for i in f});lookup={v:i for i,v in enumerate(used)}
body=[verts[i] for i in used];low=min(v[1] for v in body);high=max(v[1] for v in body);scale=170/(high-low)
positions=[[v[0]*scale,(v[1]-low)*scale,v[2]*scale] for v in body]
def hull(points):
 pts=sorted(set(points))
 def cross(o,a,b):return (a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0])
 lower=[]
 for p in pts:
  while len(lower)>=2 and cross(lower[-2],lower[-1],p)<=0:lower.pop()
  lower.append(p)
 upper=[]
 for p in reversed(pts):
  while len(upper)>=2 and cross(upper[-2],upper[-1],p)<=0:upper.pop()
  upper.append(p)
 return lower[:-1]+upper[:-1]
indices=[[lookup[i] for i in f] for f in faces]
def section(y):
 pts=[]
 for f in indices:
  vs=[positions[i] for i in f]
  if any(abs(v[0])>(19 if y>=116 else 24) for v in vs):continue
  for a,b in zip(vs,vs[1:]+vs[:1]):
   if (a[1]<=y<b[1]) or (b[1]<=y<a[1]):
    t=(y-a[1])/(b[1]-a[1]);pts.append((a[0]+t*(b[0]-a[0]),a[2]+t*(b[2]-a[2])))
 poly=hull(pts)
 return {'y':y,'circumference':sum(math.dist(a,b) for a,b in zip(poly,poly[1:]+poly[:1])),'outline':poly}
sections={key:section(y) for key,y in [('hip',88),('waist',110),('bust',124)]}
data={'source':'MakeHuman base mesh + averaged female-young macro targets (CC0)','positions':[round(c,4) for v in positions for c in v],'indices':[i for f in indices for i in f],'sections':sections}
(assets/'human-data.js').write_text('window.MUELLER_HUMAN_DATA='+json.dumps(data,separators=(',',':'))+';',encoding='utf-8')
print('vertices',len(positions),'triangles',len(indices),'sections',{k:round(v['circumference'],1) for k,v in sections.items()})
