#!/bin/bash

set -e

IMAGE_NAME=sms_statistics_service

# Check that the correct number of arguments were provided.
if [[ $# -ne 4 ]]; then
    echo "Usage: ./docker-run-incremental.sh
    <cache-volume-name> <google-cloud-credentials-file-path> <firestore-credentials-url> <last-update-volume-name>"
    exit
fi

# Assign the program arguments to bash variables.
CACHE_VOLUME_NAME=$1
GOOGLE_CLOUD_CREDENTIALS_FILE_PATH=$2
FIRESTORE_CREDENTIALS_URL=$3
LAST_UPDATE_VOLUME_NAME=$4

# Build an image for this pipeline stage.
docker build -t "$IMAGE_NAME" .

CMD="
LAST_UPDATE=\$(</last-update/last-update-timestamp.txt) && THIS_UPDATE=\$(dateutils.dround now /-10m -f '%Y-%m-%dT%H:%M:%S+00:00') && \
pipenv run python -u sms_statistics_service.py /cache /credentials/google-cloud-credentials.json ${FIRESTORE_CREDENTIALS_URL} \${LAST_UPDATE} \${THIS_UPDATE} && \
echo \"Updating the last-update-timestamp.txt file with timestamp \$THIS_UPDATE\" && \
echo \${THIS_UPDATE} >/last-update/last-update-timestamp.txt
"
container="$(docker container create -w /app --mount source="$CACHE_VOLUME_NAME",target=/cache --mount source="$LAST_UPDATE_VOLUME_NAME",target=/last-update "$IMAGE_NAME" /bin/bash -c "$CMD")"

function finish {
    # Tear down the container when done.
    docker container rm "$container" >/dev/null
}
trap finish EXIT

# Copy input data into the container
docker cp "$GOOGLE_CLOUD_CREDENTIALS_FILE_PATH" "$container:/credentials/google-cloud-credentials.json"

# Run the container
docker start -a -i "$container"
