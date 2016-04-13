chgcar.list:
	ls --color=never CHG*  | tr " " "\n" | grep CHG --color=never  > chgcar.list 
