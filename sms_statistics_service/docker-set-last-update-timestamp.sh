#!/bin/bash

set -e

IMAGE_NAME=sms_statistics_service

# Check that the correct number of arguments were provided.
if [[ $# -ne 2 ]]; then
    echo "Usage: ./docker-set-last-update-timestamp.sh <last-update-volume-name> <timestamp>"
    exit
fi

# Assign the program arguments to bash variables.
LAST_UPDATE_VOLUME_NAME=$1
TIMESTAMP=$2

# Build an image for this pipeline stage.
docker build -t "$IMAGE_NAME" .

CMD="echo \"$TIMESTAMP\" >/last-update/last-update-timestamp.txt"
container="$(docker container create -w /app --mount source="$LAST_UPDATE_VOLUME_NAME",target=/last-update "$IMAGE_NAME" /bin/bash -c "$CMD")"

function finish {
    # Tear down the container when done.
    docker container rm "$container" >/dev/null
}
trap finish EXIT

# Run the container
docker start -a -i "$container"
