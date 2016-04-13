.PHONY: build
build:
	make -C tools build
chgcar.list:
	ls --color=never CHG*  | tr " " "\n" | grep CHG --color=never  > chgcar.list 
