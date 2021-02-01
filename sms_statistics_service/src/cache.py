import json

from core_data_modules.logging import Logger
from core_data_modules.util import IOUtils, SHAUtils
from storage.google_cloud import google_cloud_utils

from src.data_models import ActiveProject

log = Logger(__name__)


class Cache(object):
    def __init__(self, cache_dir_path):
        self.cache_dir_path = cache_dir_path

    def get_firestore_credentials(self, google_cloud_credentials_file_path, firestore_credentials_url):
        cache_file_path = f"{self.cache_dir_path}/firestore_credentials/{SHAUtils.sha_string(firestore_credentials_url)}.json"
        try:
            log.info(f"Attempting to read Firestore credentials file for '{firestore_credentials_url}'' from the "
                     f"cache at '{cache_file_path}'...")
            with open(cache_file_path) as f:
                firestore_credentials = json.load(f)
            log.info("Loaded the Firestore credentials from the cache")
            return firestore_credentials
        except FileNotFoundError:
            log.info(f"Cache file '{cache_file_path}' not found; will download from Firestore")
            firestore_credentials = json.loads(google_cloud_utils.download_blob_to_string(
                google_cloud_credentials_file_path, firestore_credentials_url))

            log.info(f"Saving the downloaded Firestore credentials to '{cache_file_path}'...")
            IOUtils.ensure_dirs_exist_for_file(cache_file_path)
            with open(cache_file_path, "w") as f:
                json.dump(firestore_credentials, f)
            return firestore_credentials

    def get_active_projects(self, firestore_client):
        cache_file_path = f"{self.cache_dir_path}/active_projects.json"
        try:
            log.info(f"Attempting to read the active projects from the cache at '{cache_file_path}'...")
            with open(cache_file_path) as f:
                active_projects = [ActiveProject.from_dict(d) for d in json.load(f)]
            log.info("Loaded active projects from the cache")
            return active_projects
        except FileNotFoundError:
            log.info(f"Cache file '{cache_file_path}' not found; will download from Firestore")
            active_projects = firestore_client.get_active_projects()

            log.info(f"Saving the downloaded active projects to the cache at '{cache_file_path}'...")
            IOUtils.ensure_dirs_exist_for_file(cache_file_path)
            with open(cache_file_path, "w") as f:
                json.dump([ap.to_dict() for ap in active_projects], f)
            return active_projects

    def get_token_for_project(self, project_name, token_type, google_cloud_credentials_file_path, token_url):
        cache_file_path = f"{self.cache_dir_path}/tokens/{project_name}/{token_type}.txt"
        try:
            log.info(f"Attempting to read the {token_type} token for project '{project_name}' from the cache "
                     f"at '{cache_file_path}'")
            with open(cache_file_path) as f:
                token = f.read()
            log.info(f"Loaded the {token_type} token from the cache")
            return token
        except FileNotFoundError:
            log.info(f"Cache file '{cache_file_path}' not found; will download from Google Cloud Storage")
            token = google_cloud_utils.download_blob_to_string(
                google_cloud_credentials_file_path, token_url).strip()

            log.info(f"Saving the fetched {token_type} token to the cache at '{cache_file_path}'...")
            IOUtils.ensure_dirs_exist_for_file(cache_file_path)
            with open(cache_file_path, "w") as f:
                f.write(token)
            return token
