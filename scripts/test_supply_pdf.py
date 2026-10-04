"""Check actual typeset PDF text and metadata, not just the LaTeX source."""
from pathlib import Path
import sys,re,json,hashlib
from pypdf import PdfReader
path=Path(sys.argv[1])
reader=PdfReader(path)
text='\n'.join(page.extract_text() or '' for page in reader.pages)
normal=' '.join(text.split()).upper()
assert 'DEFLATIONARY SUPPLY' in normal,'Required supply label absent from extracted PDF text'
for content in [text,json.dumps(dict(reader.metadata or {}))]:
    assert not re.search(r'\s+'.join(['fixed','supply']),content,re.I),'Superseded supply wording in PDF text or metadata'
print(json.dumps({'pdf':str(path),'pages':len(reader.pages),'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'extractedTextSupplyCheck':'passed','metadataSupplyCheck':'passed'}))
