#!/bin/bash

set -e

IMAGE_NAME=sms_statistics_service

# Check that the correct number of arguments were provided.
if [[ $# -ne 4 ]]; then
    echo "Usage: ./docker-run-sms-statics-service.sh
    <google-cloud-credentials-file-path> <firestore-credentials-url>
    <start-minute-inclusive> <end-minute-exclusive>"
    exit
fi

# Assign the program arguments to bash variables.
GOOGLE_CLOUD_CREDENTIALS_FILE_PATH=$1
FIRESTORE_CREDENTIALS_URL=$2
START_MINUTE_INCLUSIVE=$3
END_MINUTE_EXCLUSIVE=$4

# Build an image for this pipeline stage.
docker build -t "$IMAGE_NAME" .

CMD="pipenv run python -u sms_statistics_service.py \
    /credentials/google-cloud-credentials.json \"$FIRESTORE_CREDENTIALS_URL\" \
    \"$START_MINUTE_INCLUSIVE\" \"$END_MINUTE_EXCLUSIVE\"
"
container="$(docker container create -w /app "$IMAGE_NAME" /bin/bash -c "$CMD")"

function finish {
    # Tear down the container when done.
    docker container rm "$container" >/dev/null
}
trap finish EXIT

# Copy input data into the container
docker cp "$GOOGLE_CLOUD_CREDENTIALS_FILE_PATH" "$container:/credentials/google-cloud-credentials.json"

# Run the container
docker start -a -i "$container"
