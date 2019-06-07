#!/usr/bin/env bash

set -e

# Check that the correct number of arguments were provided.
if [[ $# -ne 4 ]]; then
    echo "Usage: ./docker-run-incremental.sh
    <cache-volume-name> <google-cloud-credentials-file-path> <firestore-credentials-url> <last-update-file-path>"
    exit
fi

CACHE_VOLUME_NAME=$1
GOOGLE_CLOUD_CREDENTIALS_FILE_PATH=$2
FIRESTORE_CREDENTIALS_URL=$3
LAST_UPDATE_FILE_PATH=$4

LAST_UPDATE=$(<${LAST_UPDATE_FILE_PATH})
THIS_UPDATE=$(dround now /-10m)

./docker-run.sh ${CACHE_VOLUME_NAME} ${GOOGLE_CLOUD_CREDENTIALS_FILE_PATH} ${FIRESTORE_CREDENTIALS_URL} \
    ${LAST_UPDATE} ${THIS_UPDATE}

echo ${THIS_UPDATE} >${LAST_UPDATE_FILE_PATH}
