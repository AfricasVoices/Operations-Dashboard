import firebase_admin
from firebase_admin import credentials, firestore

from src.data_models.active_project import ActiveProject


class FirestoreWrapper(object):
    def __init__(self, cert):
        """
        :param cert: Path to a certificate file or a dict representing the contents of a certificate.
        :type cert: str or dict
        """
        cred = credentials.Certificate(cert)
        firebase_admin.initialize_app(cred)
        self.client = firestore.client()

    def get_active_projects(self):
        """
        Downloads all the active projects from Firestore

        :return: list of active projects
        :rtype: list of ActiveProject
        """
        active_projects = []
        for doc in self.client.collection(f"active_projects").get():
            active_projects.append(ActiveProject.from_dict(doc.to_dict()))
        return active_projects
