"""Refresh the bundled, attributed species/attack index and offline sprites.
Uses the Pokémon TCG API's public dataset; no API key is required.
Run from the project root: python tools/build_catalog.py
"""
import csv, io, json, re, urllib.request, concurrent.futures, pathlib, time
ROOT = pathlib.Path(__file__).resolve().parents[1]
CACHE = ROOT.parent / 'catalog-cache'
CACHE.mkdir(exist_ok=True)
BASE = 'https://raw.githubusercontent.com/PokemonTCG/pokemon-tcg-data/master/'
def get(url):
    for attempt in range(3):
        try:
            with urllib.request.urlopen(url, timeout=25) as r: return r.read()
        except Exception:
            if attempt == 2: raise
def raw(name):
    return list(csv.DictReader(io.StringIO(get('https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/'+name+'.csv').decode())))
def normalize(s): return re.sub('[^a-z0-9]', '', s.lower())
def main():
    sets = json.loads(get(BASE+'sets/en.json'))
    def read_set(s):
        p=CACHE/(s['id']+'.json')
        try:
            if not p.exists(): p.write_bytes(get(BASE+'cards/en/'+s['id']+'.json'))
            return json.loads(p.read_text())
        except Exception as e: print('Set unavailable:',s['id'],str(e),flush=True); return []
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as ex:
        allcards=[c for cards in ex.map(read_set,sets) for c in cards]
    templates=json.loads((ROOT/'data/card-templates.json').read_text())
    names={normalize(t['name']) for t in templates}
    matches={str(i):{} for i in range(1,252)}
    for c in allcards:
        dex=c.get('nationalPokedexNumbers',[])
        if len(dex)!=1 or str(dex[0]) not in matches: continue
        for attack in c.get('attacks',[]):
            key=normalize(attack['name'])
            if key in names and key not in matches[str(dex[0])]:
                matches[str(dex[0])][key]={'id':c['id'],'pokemon':c['name'],'attack':attack['name'],
                    'image':c.get('images',{}).get('small',''),'set':c['id'].rsplit('-',1)[0],
                    'source':'PokemonTCG/pokemon-tcg-data','printedDamage':attack.get('damage','')}
    rows=raw('pokemon'); types={r['id']:r['identifier'] for r in raw('types')}; assignments={}
    for r in raw('pokemon_types'):
        if int(r['pokemon_id'])<=251: assignments.setdefault(r['pokemon_id'],[]).append({'slot':int(r['slot']),'type':{'name':types[r['type_id']]}})
    species={r['id']:r for r in raw('pokemon_species')}
    pokemon={}
    for r in rows:
        i=int(r['id'])
        if i>251: continue
        pokemon[str(i)]={'id':i,'name':r['identifier'],'height':int(r['height']),'weight':int(r['weight']),
            'types':assignments[str(i)],'sprites':{'front_default':f'assets/sprites/{i}.png','back_default':f'assets/sprites/{i}-back.png',
            'other':{'official-artwork':{'front_default':f'assets/sprites/{i}.png'}}},
            'species':{'url':f'https://pokeapi.co/api/v2/pokemon-species/{i}/'},'capture_rate':int(species[str(i)]['capture_rate'])}
    jobs=[]
    for i in range(1,252):
        jobs.extend([(f'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/{i}.png',ROOT/f'assets/sprites/{i}.png'),
          (f'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/{i}.png',ROOT/f'assets/sprites/{i}-back.png')])
    cards={v['id']:v for m in matches.values() for v in m.values()}
    # Card art remains optional: remote source URLs are retained in the catalog.
    # Essential sprites are bundled; failed card-image hosts never block play.
    def download(job):
        url,p=job
        try:
            if not p.exists(): p.write_bytes(get(url))
            return str(p.relative_to(ROOT))
        except Exception: return None
    print('Catalog:',len(allcards),'cards;',sum(len(x) for x in matches.values()),'species/attack matches;',len(jobs),'images',flush=True)
    with concurrent.futures.ThreadPoolExecutor(max_workers=16) as ex: downloaded=set(ex.map(download,jobs))
    for m in matches.values():
        for c in m.values():
            local=f"assets/cards/{c['id']}.png"
            if local in downloaded: c['localImage']=local
    payload={'version':2,'source':BASE,'generated':time.strftime('%Y-%m-%d'),'species':matches}
    (ROOT/'data/tcg-catalog.js').write_text('globalThis.TCG_CATALOG = '+json.dumps(payload,separators=(',',':'))+';\n')
    (ROOT/'data/pokemon.js').write_text('globalThis.OFFLINE_POKEMON = '+json.dumps(pokemon,separators=(',',':'))+';\n')
    (ROOT/'data/catalog-stats.json').write_text(json.dumps({'cardsScanned':len(allcards),'matchedAttacks':sum(len(x) for x in matches.values()),'speciesWithMatches':sum(bool(x) for x in matches.values()),'imagesDownloaded':len(downloaded-{None}),'imageFailures':len(jobs)-len(downloaded-{None})},indent=2))
    print((ROOT/'data/catalog-stats.json').read_text(),flush=True)
if __name__=='__main__': main()
