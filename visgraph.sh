dotfile="./tmp/output.dot"
svgfile="./tmp/output.svg"


#dot -Knop2 -Gmaxiter=1000 -Tsvg $dotfile > $svgfile
dot -Ksfdp -Tsvg $dotfile > $svgfile
wslview $svgfile