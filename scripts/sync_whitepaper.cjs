const fs = require('node:fs');
fs.copyFileSync('docs/WHITEPAPER.md', 'public/WHITEPAPER.md');
if (fs.existsSync('docs/Viper_Coin_Whitepaper.tex')) fs.copyFileSync('docs/Viper_Coin_Whitepaper.tex', 'public/Viper_Coin_Whitepaper.tex');
