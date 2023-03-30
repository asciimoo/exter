#!/bin/sh

set -e

TMP_DIR="/tmp/exter_docs"

if [ -d "$TMP_DIR" ]; then
    rm -r "$TMP_DIR"
fi

./build.sh
cp -r dist "$TMP_DIR"
cd ../
git checkout gh-pages
cp -r "$TMP_DIR"/* .
git add .
git commit -a -m '[enh] update documentation'
git checkout master
rm -r "$TMP_DIR"
cd docs
echo "[!] Documentation rendered to gh-pages branch. Don't forget to push it!"
