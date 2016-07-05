#! /usr/bin/env bash

function header()   { echo -e "\n\033[1m$@\033[0m"; }
function success()  { echo -e " \033[1;32m==>\033[0m  $@"; }
function error()    { echo -e " \033[1;31mX\033[0m  $@"; }
function arrow()    { echo -e " \033[1;34m==>\033[0m  $@"; }

test_dir=tests
original_viewer=build/viewer.html


find ${test_dir} | grep viewer.html | while read viewer; do

arrow "Processing ${viewer}"

cp ${original_viewer} $(dirname ${viewer})

done
