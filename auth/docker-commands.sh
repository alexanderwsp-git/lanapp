docker buildx build --platform linux/amd64,linux/arm64 -t alexander/auth:1.0 .

docker run --rm -it --name auth --env-file=.env alexander/auth:1.0