up: down drop
    docker compose --profile production up --detach

down:
    docker compose --profile development --profile production down

dev:
    docker compose --profile development watch

drop: down
    -docker volume rm $(docker volume ls | awk '/.*mongo-*/{print $2}')