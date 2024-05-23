start:
	docker-compose up

restart:
	docker-compose restart

stop:
	docker-compose stop

rebuild: remove_image
	docker-compose up --build

remove_image: clean
	docker rmi support-bot

clean:
	docker-compose down

