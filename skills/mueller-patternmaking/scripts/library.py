"""Read-only lookup of the owner's books and private OCR cache."""
from pathlib import Path
import argparse,hashlib,json,os,re,subprocess,sys

BASE=Path(__file__).resolve().parent.parent
if hasattr(sys.stdout,'reconfigure'):sys.stdout.reconfigure(encoding='utf-8')

def configuration():
    data=json.loads((BASE/'references/library.json').read_text(encoding='utf-8'))
    data['library_root']=os.environ.get('MUELLER_LIBRARY_ROOT') or data.get('library_root') or ''
    data['ocr_cache_root']=os.environ.get('MUELLER_OCR_CACHE') or data.get('ocr_cache_root') or str(BASE/'.private-ocr-cache')
    return data

def normalize(text):
    text=text.casefold().replace('ё','е')
    return re.sub(r'([а-я])-\s+([а-я])',r'\1\2',text)

def book_by_id(config,key):
    for book in config['books']:
        if book['id']==key:return book
    raise ValueError('Unknown book ID: '+key)

def source_path(config,book):
    override=os.environ.get('MUELLER_BOOK_'+book['id'].upper())
    if override:return Path(override)
    root=config.get('library_root')
    if not root:return Path('__set_MUELLER_LIBRARY_ROOT__')/book['filename']
    primary=Path(root)/book['filename']
    if primary.is_file() or not book.get('desktop_fallback'):return primary
    return Path.home()/'Desktop'/book['filename']

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    commands=parser.add_subparsers(dest='command',required=True)
    listing=commands.add_parser('list');listing.add_argument('--verify',action='store_true')
    finding=commands.add_parser('search');finding.add_argument('query');finding.add_argument('--book');finding.add_argument('--limit',type=int,default=8)
    page=commands.add_parser('page');page.add_argument('book');page.add_argument('number',type=int);page.add_argument('--image',action='store_true');page.add_argument('--render-out')
    commands.add_parser('coverage')
    args=parser.parse_args();config=configuration();cache=Path(config['ocr_cache_root'])
    if args.command in ('list','coverage'):
        rows=[]
        for book in config['books']:
            path=source_path(config,book)
            row={'id':book['id'],'title':book['title'],'pdf_pages':book['pdf_pages'],'source_exists':path.is_file(),
                 'ocr_pages':len(list((cache/book['id']).glob('*.json'))) if (cache/book['id']).exists() else 0}
            if args.command=='list' and args.verify and path.exists():row['sha256_matches']=hashlib.sha256(path.read_bytes()).hexdigest()==book['sha256']
            rows.append(row)
        print(json.dumps({'books':rows,'note':'OCR availability is not proof that all formulas are visually verified.'},ensure_ascii=False,indent=2));return
    if args.command=='search':
        if not cache.exists():raise ValueError('Private OCR cache not found. Set MUELLER_OCR_CACHE or render/read the source PDF.')
        terms=[normalize(x) for x in args.query.split() if x.strip()]
        if not terms:raise ValueError('Supply a search term')
        books=[book_by_id(config,args.book)] if args.book else config['books']
        hits=[]
        for book in books:
            for path in (cache/book['id']).glob('*.txt'):
                text=path.read_text(encoding='utf-8');norm=normalize(text)
                score=sum(norm.count(term) for term in terms)
                if not score:continue
                first=min(norm.find(term) for term in terms if term in norm)
                hits.append({'book':book['id'],'pdf_page':int(path.stem),'score':score,'excerpt':text[max(0,first-90):first+300]})
        hits.sort(key=lambda x:(-x['score'],x['book'],x['pdf_page']))
        print(json.dumps(hits[:max(1,min(args.limit,100))],ensure_ascii=False,indent=2));return
    book=book_by_id(config,args.book)
    if not 1<=args.number<=book['pdf_pages']:raise ValueError('Page outside this PDF')
    record=cache/book['id']/f'{args.number:03d}.json'
    if args.render_out:
        output=Path(args.render_out).resolve();output.parent.mkdir(parents=True,exist_ok=True)
        source=source_path(config,book)
        if not source.exists():raise ValueError('Source book is not available at '+str(source))
        from pypdf import PdfReader
        reader=PdfReader(source);selected=reader.pages[args.number-1];images=selected.images
        if len(images)==1 and not int(selected.get('/Rotate',0)):
            image=images[0].image.convert('RGB');image.save(output)
        else:
            if output.suffix.lower()!='.png':raise ValueError('Use .png for a rendered multipiece PDF page')
            subprocess.run(['pdftoppm','-f',str(args.number),'-l',str(args.number),'-singlefile','-scale-to','2400','-png',str(source),str(output.with_suffix(''))],check=True)
        print(str(output));return
    if not record.exists():raise ValueError('OCR for this page is unavailable; use --render-out to inspect the source.')
    data=json.loads(record.read_text(encoding='utf-8'))
    print(data['image'] if args.image else data['text'])

if __name__=='__main__':
    try:main()
    except (ValueError,OSError) as error:
        print(json.dumps({'error':str(error)},ensure_ascii=False),file=sys.stderr);sys.exit(2)
