# npm i -g pwa-asset-generator
cd public
rm -f index.html
ln -s ../index.html index.html 
pwa-asset-generator icon.svg -i index.html -m manifest.json assets/