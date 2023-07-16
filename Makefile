build:
	docker build -t db-bot .

run:
	docker run -d -p 3000:3000 --name db-bot --rm db-bot