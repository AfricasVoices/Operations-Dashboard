import argparse
import json

from core_data_modules.logging import Logger
from storage.google_cloud import google_cloud_utils

from src import FirestoreWrapper

Logger.set_project_name("OpsDashboard")
log = Logger(__name__)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="TODO")

    parser.add_argument("google_cloud_credentials_file_path", metavar="google-cloud-credentials-file-path",
                        help="Path to a Google Cloud service account credentials file to use to access the "
                             "credentials bucket")
    parser.add_argument("firestore_credentials_url", metavar="firestore-credentials-url",
                        help="GS URL to the credentials file to use to access the Firestore instance with "
                             "the operations statistics")

    args = parser.parse_args()

    google_cloud_credentials_file_path = args.google_cloud_credentials_file_path
    firestore_credentials_url = args.firestore_credentials_url

    log.info("Initialising the Firestore client...")
    firestore_credentials = json.loads(google_cloud_utils.download_blob_to_string(
            google_cloud_credentials_file_path, firestore_credentials_url))
    firestore_wrapper = FirestoreWrapper(firestore_credentials)

    log.info("Downloading the active projects from Firestore...")
    active_projects = firestore_wrapper.get_active_projects()

    log.info("Active projects found:")
    for project in active_projects:
        log.info(project.project_name)
