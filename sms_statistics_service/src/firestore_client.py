import firebase_admin
from core_data_modules.logging import Logger
from firebase_admin import credentials, firestore

from src.data_models.active_project import ActiveProject

log = Logger(__name__)


class FirestoreClient(object):
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

    def _get_sms_stat_doc_ref(self, project_name, iso_string):
        return self.client.document(f"metrics/rapid_pro/{project_name}/{iso_string}")

    def get_active_projects(self):
        """
        Downloads all the active projects from Firestore

        :return: list of active projects
        :rtype: list of ActiveProject
        """
        active_projects = []
        for doc in self._get_active_projects_collection_ref().get():
            active_projects.append(ActiveProject.from_dict(doc.to_dict()))
        return active_projects

    def update_sms_stats(self, project_name, iso_string, sms_stats):
        """

        :param project_name:
        :type project_name: str
        :param iso_string:
        :type iso_string: str
        :param sms_stats:
        :type sms_stats: data_models.SMSStats
        """
        log.info(f"Updating SMS stats for project {project_name} at time {iso_string}...")
        self._get_sms_stat_doc_ref(project_name, iso_string).set(sms_stats.to_dict())
        log.info("SMS stats updated")

    def update_sms_stats_batch(self, project_name, sms_stats_batch):
        """

        :param project_name:
        :type project_name: str
        :param sms_stats_batch:
        :type sms_stats_batch: dict of str -> data_models.SMSStats
        """
        log.info(f"Batch updating {len(sms_stats_batch)} SMS stats for project {project_name}...")
        batch = self.client.batch()
        for iso_string, sms_stats in sms_stats_batch.items():
            batch.set(self._get_sms_stat_doc_ref(project_name, iso_string), sms_stats.to_dict())
        batch.commit()
        log.info("SMS stats updated")

        # total_messages_count = len(messages)
        # i = 0
        # batch_counter = 0
        # batch = client.batch()
        # for message in messages:
        #     i += 1
        #     id = message["MessageID"]
        #     batch.set(get_message_ref(dataset_id, id), message)
        #     batch_counter += 1
        #     if batch_counter >= batch_size:
        #         batch.commit()
        #         print(
        #             "Batch of {} messages committed, progress: {} / {}".format(batch_counter, i, total_messages_count))
        #         batch_counter = 0
        #         batch = client.batch()
        #
        # if batch_counter > 0:
        #     batch.commit()
        #     print("Final batch of {} messages committed".format(batch_counter))
        #
        # print("Written {} messages".format(i))
