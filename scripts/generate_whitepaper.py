"""Generate the standalone full-width journal-style LaTeX source from the canonical white paper."""
from pathlib import Path
import re
SOURCE = Path('docs/WHITEPAPER.md')
DEST = Path('docs/Viper_Coin_Whitepaper.tex')
references = []
def escape(text):
    text = text.replace('−', '-').replace('×', ' x ').replace('·', ' / ').replace('’', "'").replace('“', '``').replace('”', "''").replace('–', '--').replace('—', '---')
    return ''.join({'\\': r'\textbackslash{}', '&': r'\&', '%': r'\%', '$': r'\$', '#': r'\#', '_': r'\_', '{': r'\{', '}': r'\}', '~': r'\textasciitilde{}', '^': r'\textasciicircum{}'}.get(ch,ch) for ch in text)
def inline(text):
    parts = re.split(r'(\[[^\]]+\]\(https://[^)]+\)|\*\*[^*]+\*\*|`[^`]+`)',text)
    output = []
    for part in parts:
        link = re.fullmatch(r'\[([^\]]+)\]\((https://[^)]+)\)',part)
        if link:
            ref=(link[1],link[2])
            if ref not in references: references.append(ref)
            output.append(escape(link[1])+r'~\cite{ref'+str(references.index(ref)+1)+'}')
        elif part.startswith('**') and part.endswith('**'): output.append(r'\textbf{'+inline(part[2:-2])+'}')
        elif part.startswith('`') and part.endswith('`'): output.append(r'\texttt{'+escape(part[1:-1])+'}')
        else: output.append(escape(part))
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
\definecolor{viper}{RGB}{37,75,37}
\hypersetup{pdftitle={Viper Coin (V1PR): Protocol White Paper},pdfauthor={Viper Coin},pdfsubject={Sui token, fixed supply, funded lock rewards and public verification}}
\setlength{\parindent}{1em}
\setlength{\parskip}{2pt}
\setlength{\headheight}{14pt}
\pagestyle{fancy}
\fancyhf{}
\fancyhead[L]{\footnotesize\sffamily Viper Coin (V1PR)}
\fancyhead[R]{\footnotesize\sffamily Protocol White Paper}
\fancyfoot[C]{\footnotesize\thepage}
\renewcommand{\headrulewidth}{0.3pt}
\renewcommand{\arraystretch}{1.18}
\setlength{\emergencystretch}{1.5em}
\urlstyle{same}
\begin{document}
\begin{center}
{\small\sffamily\color{viper} SUI / FIXED SUPPLY / FUNDED LOCK REWARDS}\par\vspace{8pt}
{\LARGE\bfseries Viper Coin (V1PR)}\par\vspace{4pt}
{\large Protocol White Paper}\par\vspace{6pt}
{\small Viper Coin / Release specification / 2 October 2026}\par\vspace{10pt}
\end{center}
\noindent\textbf{Abstract.} Viper Coin is a Sui meme token with a once-minted, burn-only supply of one billion V1PR. This paper specifies its seven allocation buckets, approved free claims, fully funded and non-transferable lock positions, exponential annual token rates and term rewards, time-tapered exit fees, supply-decreasing burns, public onchain monitoring, and the boundaries of optional privacy. Rewards distribute existing inventory and each accepted obligation is escrowed in full. Annual token rates do not guarantee a financial return. Website publication is separate from token deployment; no mainnet coin or funded exchange pool is live at the date of this specification.\par\vspace{6pt}
\noindent\textbf{Keywords:} Sui; Move; burn-only currency; escrow; token rewards; public verification.\par\vspace{10pt}
\hrule\vspace{14pt}
'''
FORMULAS = {
'`annual rate = 1% × 10^((months − 1) / 23)`': r'''\begin{equation}
r(M)=0.01\,10^{(M-1)/23},\quad R(P,M)=\left\lfloor P\,r(M)\frac{M}{12}\right\rfloor.
\end{equation}''',
'`fee = floor(principal × 5% × remaining time / agreed duration)`': r'''\begin{equation}
F(P,D,E)=\left\lfloor 0.05P\frac{D-E}{D}\right\rfloor.
\end{equation}''',
'`available reward inventory + outstanding reserved rewards + rewards paid = rewards funded`': r'''\begin{equation}
A+C+Y=T,
\end{equation}
\noindent where $A$ is available rewards, $C$ committed rewards, $Y$ rewards paid, and $T$ all rewards funded.'''
}
blocks=SOURCE.read_text().strip().split('\n\n')
body=[];table_number=0
for block in blocks:
    if block.startswith('# ') or block.startswith('**Release specification'): continue
    if block.startswith('## '):
        title=re.sub(r'^## \d+\. ','',block)
        body.append(r'\section{'+escape(title)+'}')
    elif block in FORMULAS: body.append(FORMULAS[block])
    elif block.startswith('|'):
        table_number+=1
        rows=[[cell.strip() for cell in line.strip().strip('|').split('|')] for line in block.splitlines()]
        rows=[row for row in rows if not all(re.fullmatch(r':?-+:?',cell) for cell in row)]
        env='table'
        width=r'\textwidth'
        specs={1:'lX',2:'X r r X',3:'l r X X'}[table_number]
        captions={1:'Coin identity and supply rules.',2:'Initial allocation of the complete one-billion V1PR supply.',3:'Annual token rates and complete-term rewards; before network gas.'}
        head=rows[0]
        body.append(r'\begin{'+env+r'}[H]\centering\small'+'\n'+r'\caption{'+captions[table_number]+'}\n'+r'\begin{tabularx}{'+width+'}{'+specs+'}\n'+r'\toprule'+'\n'+' & '.join(r'\textbf{'+escape(c)+'}' for c in head)+r' \\'+ '\n'+r'\midrule'+'\n'+'\n'.join(' & '.join(inline(c) for c in row)+r' \\' for row in rows[1:])+'\n'+r'\bottomrule\end{tabularx}'+'\n'+r'\end{'+env+'}')
    else: body.append(inline(block.replace('\n',' ')))
refs=r'\begin{thebibliography}{9}'+'\n'+r'\footnotesize'+'\n'+'\n'.join(r'\bibitem{ref'+str(i)+'} '+escape(title)+'. '+r'\url{'+url+'}.' for i,(title,url) in enumerate(references,1))+'\n'+r'\end{thebibliography}'
DEST.write_text(PREAMBLE+'\n\n'.join(body)+'\n\n'+refs+'\n'+r'\end{document}'+'\n')
print(f'Generated {DEST}: {table_number} tables, {len(references)} references.')
