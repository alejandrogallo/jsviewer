.PHONY: build
all: build update-test-viewer
build:
	bash tools/build.sh
test-chgcar.list:
	ls --color=never tests/data/CHG*  | tr " " "\n"  > chgcar.list 

update-test-viewer:
	bash tools/update-test-viewer.sh


BROWSER=firefox
open-tests:
	find tests | grep viewer.html | xargs -n1 firefox

