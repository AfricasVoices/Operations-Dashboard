import firebase_admin
from core_data_modules.logging import Logger
from firebase_admin import credentials, firestore

from src.data_models.active_project import ActiveProject

log = Logger(__name__)


class FirestoreClient(object):
    MAX_BATCH_SIZE = 500

    def __init__(self, cert):
        """
        :param cert: Path to a certificate file or a dict representing the contents of a certificate.
        :type cert: str or dict
        """
        cred = credentials.Certificate(cert)
        firebase_admin.initialize_app(cred)
        self.client = firestore.client()

    def _get_active_projects_collection_ref(self):
        return self.client.collection(f"active_projects")

    def _get_sms_stats_doc_ref(self, project_name):
        return self.client.document(f"metrics/rapid_pro/projects/{project_name}")

    def get_active_projects(self):
        """
        Downloads all the active projects from Firestore.

        :return: list of active projects.
        :rtype: list of ActiveProject
        """
        active_projects = []
        for doc in self._get_active_projects_collection_ref().get():
            active_projects.append(ActiveProject.from_dict(doc.to_dict()))
        return active_projects

    def update_sms_stats(self, project_name, sms_stats_batch):
        """
        Updates a batch of SMS stats for the given project.

        :param project_name: Name of project to update the SMS stats of.
        :type project_name: str
        :param sms_stats_batch: Dictionary of iso_string -> SMSStats to update that timestamp with.
        :type sms_stats_batch: dict of str -> src.data_models.SMSStats
        """
        log.info(f"Batch updating {len(sms_stats_batch)} SMS stats for project {project_name}...")

        doc_ref = self._get_sms_stats_doc_ref(project_name)
        updates = {iso_string: sms_stats.to_dict() for iso_string, sms_stats in sms_stats_batch.items()}

        if not doc_ref.get().exists:
            log.warning(f"No SMS stats document exists for project {project_name}; will create one...")
            doc_ref.set(updates)
        else:
            doc_ref.update(updates)

        log.info("SMS stats updated")
