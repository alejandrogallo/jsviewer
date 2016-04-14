.PHONY: build
all: build
build:
	make -C tools build
test-chgcar.list:
	ls --color=never tests/data/CHG*  | tr " " "\n"  > chgcar.list 
