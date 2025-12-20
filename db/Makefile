re: clean run

run:
	docker-compose up

clean:
	sudo rm -rf postgres
	sudo mkdir postgres
	sudo chown -R 999:999 ./postgres
	sudo chmod -R 700 ./postgres
	sudo chown -R 999:999 ./create
	sudo chmod -R 755 ./create

.PHONY: re run clean