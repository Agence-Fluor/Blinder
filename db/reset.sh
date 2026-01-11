docker stop pgadmin
docker rm pgadmin
docker stop postgres
docker rm postgres
sudo cp create-src/* create
sudo rm -rf postgres
docker-compose up
