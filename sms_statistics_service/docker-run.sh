#!/bin/bash

set -e

IMAGE_NAME=sms_statistics_service

# Check that the correct number of arguments were provided.
if [[ $# -ne 5 ]]; then
    echo "Usage: ./docker-run-sms-statistics-service.sh
    <cache-volume-name> <google-cloud-credentials-file-path> <firestore-credentials-url>
    <start-minute-inclusive> <end-minute-exclusive>"
    exit
fi

# Assign the program arguments to bash variables.
CACHE_VOLUME_NAME=$1
GOOGLE_CLOUD_CREDENTIALS_FILE_PATH=$2
FIRESTORE_CREDENTIALS_URL=$3
START_MINUTE_INCLUSIVE=$4
END_MINUTE_EXCLUSIVE=$5

# Build an image for this pipeline stage.
docker build -t "$IMAGE_NAME" .

CMD="pipenv run python -u sms_statistics_service.py \
    /cache /credentials/google-cloud-credentials.json \"$FIRESTORE_CREDENTIALS_URL\" \
    \"$START_MINUTE_INCLUSIVE\" \"$END_MINUTE_EXCLUSIVE\"
"
container="$(docker container create -w /app --mount source="$CACHE_VOLUME_NAME",target=/cache "$IMAGE_NAME" /bin/bash -c "$CMD")"

function finish {
    # Tear down the container when done.
    docker container rm "$container" >/dev/null
}
trap finish EXIT

# Copy input data into the container
docker cp "$GOOGLE_CLOUD_CREDENTIALS_FILE_PATH" "$container:/credentials/google-cloud-credentials.json"

# Run the container
docker start -a -i "$container"
