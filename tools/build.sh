#! /usr/bin/env bash

function header()   { echo -e "\n\033[1m$@\033[0m"; }
function success()  { echo -e " \033[1;32m✔\033[0m  $@"; }
function error()    { echo -e " \033[1;31m✖\033[0m  $@"; }
function arrow()    { echo -e " \033[1;34m➜\033[0m  $@"; }

####################################
#  Rough script to create a build  #
####################################

VIEWER="../viewer.html"
BUILD_VIEWER="../build/viewer.html"

mkdir -p ../build

header "Examining $VIEWER..."
js_files=$(cat $VIEWER | grep "<script" | grep src | sed -e "s/.*src=\"\(\S*\)\".*/\1/")


header "Creating new viewer in $BUILD_VIEWER "
cat $VIEWER | sed -e "/script.*src.*/d" -e "/<\/body/d" -e "/<\/html/d" > $BUILD_VIEWER


for fileName in $js_files; do

  arrow "Parsing file $fileName"

  if [ ! -f ../$fileName ]; then
    error "File $fileName not found"
    continue
  fi

  cat >> $BUILD_VIEWER <<EOF
  <script>
  $(cat ../$fileName)
  </script>
EOF
done

echo "</body></html>" >> $BUILD_VIEWER

