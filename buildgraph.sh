dotfile="./tmp/output.dot"
svgfile="./tmp/output.svg"

npm run --silent build:graph > $dotfile

cat $dotfile

./visgraph.sh