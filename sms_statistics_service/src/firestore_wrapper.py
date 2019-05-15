import firebase_admin
from core_data_modules.logging import Logger
from firebase_admin import credentials, firestore

from src.data_models.active_project import ActiveProject

log = Logger(__name__)


class FirestoreWrapper(object):
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

    def _get_sms_stat_doc_ref(self, project_name, date_string):
        return self.client.document(f"metrics/rapid_pro/{project_name}/{date_string}")

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

    def update_sms_stats(self, project_name, iso_string, sms_stats):
        """
        Updates the SMS stats for the given project and timestamp.

        :param project_name: Name of project to update the SMS stats of.
        :type project_name: str
        :param iso_string: ISO 8601 formatted string to update the SMS stats of.
        :type iso_string: str
        :param sms_stats: SMS stats to update with.
        :type sms_stats: src.data_models.SMSStats
        """
        log.info(f"Updating SMS stats for project {project_name} at time {iso_string}...")
        self._get_sms_stat_doc_ref(project_name, iso_string).set(sms_stats.to_dict())
        log.info("SMS stats updated")

    def update_sms_stats_batch(self, project_name, sms_stats_batch):
        """
        Updates a batch of SMS stats for the given project.

        :param project_name: Name of project to update the SMS stats of.
        :type project_name: str
        :param sms_stats_batch: Dictionary of iso_string -> SMSStats to update that timestamp with.
        :type sms_stats_batch: dict of str -> src.data_models.SMSStats
        """
        log.info(f"Batch updating {len(sms_stats_batch)} SMS stats for project {project_name}...")
        batch = self.client.batch()
        batch_counter = 0
        total_progress = 0
        for iso_string, sms_stats in sms_stats_batch.items():
            batch.set(self._get_sms_stat_doc_ref(project_name, iso_string), sms_stats.to_dict())
            batch_counter += 1
            total_progress += 1

            if batch_counter >= self.MAX_BATCH_SIZE:
                batch.commit()
                log.info(f"Batch of {batch_counter} messages committed, progress: {total_progress} / {len(sms_stats_batch)}")
                batch = self.client.batch()
                batch_counter = 0

        if batch_counter > 0:
            batch.commit()
            log.info(f"Final batch of {batch_counter} messages committed")

        log.info("SMS stats updated")
