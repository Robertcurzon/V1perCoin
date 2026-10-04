"""Generate the standalone full-width journal-style LaTeX source from the canonical white paper."""
from pathlib import Path
import re
SOURCE = Path('docs/WHITEPAPER.md')
DEST = Path('docs/Viper_Coin_Whitepaper.tex')
references = []
def escape(text):
    text = text.replace('−', '-').replace('×', ' x ').replace('·', ' / ').replace('’', "'").replace('“', '``').replace('”', "''").replace('–', '--').replace('—', '---')
    return ''.join({'\\': r'\textbackslash{}', '&': r'\&', '%': r'\%', '$': r'\$', '#': r'\#', '_': r'\_', '{': r'\{', '}': r'\}', '~': r'\textasciitilde{}', '^': r'\textasciicircum{}'}.get(ch,ch) for ch in text)
def styled(text):
    return escape(text).replace('V1PER', r'\VOnePER{}')
def inline(text):
    parts = re.split(r'(\[[^\]]+\]\(https://[^)]+\)|\*\*[^*]+\*\*|`[^`]+`)',text)
    output = []
    for part in parts:
        link = re.fullmatch(r'\[([^\]]+)\]\((https://[^)]+)\)',part)
        if link:
            ref=(link[1],link[2])
            if ref not in references: references.append(ref)
            output.append(styled(link[1])+r'~\cite{ref'+str(references.index(ref)+1)+'}')
        elif part.startswith('**') and part.endswith('**'): output.append(r'\textbf{'+inline(part[2:-2])+'}')
        elif part.startswith('`') and part.endswith('`'): output.append(r'\texttt{'+escape(part[1:-1])+'}')
        else: output.append(styled(part))
    return ''.join(output)
PREAMBLE=r'''% Generated from docs/WHITEPAPER.md by scripts/generate_whitepaper.py.
% Standalone source: no external images, bibliography files or project inputs.
\documentclass[11pt]{article}
\usepackage[T1]{fontenc}
\usepackage[utf8]{inputenc}
\usepackage{lmodern}
\usepackage[a4paper,margin=22mm]{geometry}
\usepackage{amsmath,amssymb,booktabs,tabularx,array,microtype,xcolor,fancyhdr,float}
\usepackage{xurl}
\usepackage[colorlinks=true,linkcolor=black,citecolor=black,urlcolor=black]{hyperref}
\definecolor{viper}{HTML}{101510}
\definecolor{brandone}{HTML}{A3155E}
\newcommand{\VOnePER}{\texorpdfstring{V\textcolor{brandone}{1}PER}{V1PER}}
\hypersetup{pdftitle={V1PER Coin (V1PER): Protocol White Paper},pdfauthor={V1PER Coin},pdfsubject={Sui token, deflationary supply, funded lock rewards and public verification}}
\setlength{\parindent}{1em}
\setlength{\parskip}{2pt}
\setlength{\headheight}{14pt}
\pagestyle{fancy}
\fancyhf{}
\fancyhead[L]{\footnotesize\sffamily \VOnePER{} Coin (\VOnePER{})}
\fancyhead[R]{\footnotesize\sffamily Protocol White Paper}
\fancyfoot[C]{\footnotesize\thepage}
\renewcommand{\headrulewidth}{0.3pt}
\renewcommand{\arraystretch}{1.18}
\setlength{\emergencystretch}{1.5em}
\urlstyle{same}
\begin{document}
\begin{center}
{\small\sffamily\color{viper} SUI / DEFLATIONARY SUPPLY / FUNDED LOCK REWARDS}\par\vspace{8pt}
{\LARGE\bfseries \VOnePER{} Coin (\VOnePER{})}\par\vspace{4pt}
{\large Protocol White Paper}\par\vspace{6pt}
{\small \VOnePER{} Coin / Release specification / 3 October 2026}\par\vspace{10pt}
\end{center}
\noindent Abstract. \VOnePER{} Coin combines a deflationary, once-minted supply of one billion \VOnePER{} with community claims, the Feast contribution program and fully escrowed lock rewards. This paper defines allocation, vesting, annual token rates, early-exit fees, burns, \VOnePER{} Foundation custody, public verification and privacy boundaries. Rewards use existing inventory. No mainnet coin or funded exchange pool is live at this specification's date.\par\vspace{6pt}
\noindent Keywords: Sui; Move; burn-only currency; escrow; token rewards; public verification.\par\vspace{10pt}
\hrule\vspace{14pt}
'''
FORMULAS = {
'`annual rate = 1% × 10^((months − 1) / 23)`': r'''\begin{equation}
r(M)=0.01\,10^{(M-1)/23},\quad R(P,M)=\left\lfloor \frac{P\,\lfloor 10^6 r(M)\rfloor M}{12\times10^6}\right\rfloor.
\end{equation}''',
'`fee = floor(principal × 5% × max(remaining time, 0) / agreed duration)`': r'''\begin{equation}
F(P,D,E)=\left\lfloor 0.05P\frac{\max(D-E,0)}{D}\right\rfloor.
\end{equation}''',
'`available reward inventory + outstanding reserved rewards + rewards paid = rewards funded`': r'''\begin{equation}
A+C+Y=T,
\end{equation}
\noindent where $A$ is available rewards, $C$ committed rewards, $Y$ rewards paid, and $T$ all rewards funded.'''
}
blocks=SOURCE.read_text().strip().split('\n\n')
body=[];table_number=0
for block in blocks:
    if block.startswith('# ') or block.startswith('**Release specification') or block.startswith('Release specification'): continue
    if block.startswith('## '):
        title=re.sub(r'^## \d+\. ','',block)
        body.append(r'\section{'+styled(title)+'}')
    elif block in FORMULAS: body.append(FORMULAS[block])
    elif block.startswith('|'):
        table_number+=1
        rows=[[cell.strip() for cell in line.strip().strip('|').split('|')] for line in block.splitlines()]
        rows=[row for row in rows if not all(re.fullmatch(r':?-+:?',cell) for cell in row)]
        env='table'
        width=r'\textwidth'
        specs={1:'lX',2:'X r r X',3:'l r X X',4:'l X X'}[table_number]
        captions={1:'Coin identity and supply rules.',2:'Initial allocation of the complete one-billion V1PER supply.',3:'Annual token rates and complete-term rewards; before network gas.',4:'Launch phases; T is the published opening and F the actual Feast finalization.'}
        head=rows[0]
        body.append(r'\begin{'+env+r'}[H]\centering\small'+'\n'+r'\caption{'+styled(captions[table_number])+'}\n'+r'\begin{tabularx}{'+width+'}{'+specs+'}\n'+r'\toprule'+'\n'+' & '.join(r'\textbf{'+styled(c)+'}' for c in head)+r' \\'+ '\n'+r'\midrule'+'\n'+'\n'.join(' & '.join(inline(c) for c in row)+r' \\' for row in rows[1:])+'\n'+r'\bottomrule\end{tabularx}'+'\n'+r'\end{'+env+'}')
    else: body.append(inline(block.replace('\n',' ')))
refs=r'\begin{thebibliography}{9}'+'\n'+r'\footnotesize'+'\n'+'\n'.join(r'\bibitem{ref'+str(i)+'} '+escape(title)+'. '+r'\url{'+url+'}.' for i,(title,url) in enumerate(references,1))+'\n'+r'\end{thebibliography}'
DEST.write_text(PREAMBLE+'\n\n'.join(body)+'\n\n'+refs+'\n'+r'\end{document}'+'\n')
print(f'Generated {DEST}: {table_number} tables, {len(references)} references.')
