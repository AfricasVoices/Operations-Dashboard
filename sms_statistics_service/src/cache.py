import json

from core_data_modules.logging import Logger
from core_data_modules.util import IOUtils

from src.data_models import ActiveProject

log = Logger(__name__)


class Cache(object):
    ACTIVE_PROJECTS_FILE_NAME = "active_projects.json"

    def __init__(self, cache_dir_path, firestore_client):
        self.cache_dir_path = cache_dir_path
        self.firestore_client = firestore_client

        IOUtils.ensure_dirs_exist(self.cache_dir_path)

    def get_active_projects(self):
        cache_file_path = f"{self.cache_dir_path}/{self.ACTIVE_PROJECTS_FILE_NAME}"
        try:
            log.info(f"Attempting to read the active projects from the cache at '{cache_file_path}'...")
            with open(cache_file_path) as f:
                active_projects = [ActiveProject.from_dict(d) for d in json.load(f)]
                log.info("Loaded active projects from the cache")
                return active_projects
        except FileNotFoundError:
            log.info(f"Cache file '{cache_file_path}' not found; will download from Firestore")
            active_projects = self.firestore_client.get_active_projects()
            with open(cache_file_path, "w") as f:
                json.dump([ap.to_dict() for ap in active_projects], f)
            return active_projects
