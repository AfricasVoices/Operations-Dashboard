class ActiveProject(object):
    def __init__(self, project_name, rapid_pro_domain, rapid_pro_token_url, operator_names, africas_talking):
        self.project_name = project_name
        self.rapid_pro_domain = rapid_pro_domain
        self.rapid_pro_token_url = rapid_pro_token_url
        self.operator_names = operator_names
        self.africas_talking = africas_talking

    def to_dict(self):
        return {
            "project_name": self.project_name,
            "rapid_pro_domain": self.rapid_pro_domain,
            "rapid_pro_token_url": self.rapid_pro_token_url,
            "operator_names": self.operator_names,
            "africas_talking": self.africas_talking.to_dict() if self.africas_talking is not None else None
        }

    @classmethod
    def from_dict(cls, source):
        project_name = source["project_name"]
        rapid_pro_domain = source["rapid_pro_domain"]
        rapid_pro_token_url = source["rapid_pro_token_url"]
        operator_names = source["operator_names"]

        africas_talking = source.get("africas_talking")
        if africas_talking is not None:
            africas_talking = AfricasTalkingConfiguration.from_dict(africas_talking)

        return cls(project_name, rapid_pro_domain, rapid_pro_token_url, operator_names, africas_talking)


class AfricasTalkingConfiguration(object):
    def __init__(self, username, token_url):
        self.username = username
        self.token_url = token_url

    def to_dict(self):
        return {
            "username": self.username,
            "token_url": self.token_url
        }

    @classmethod
    def from_dict(cls, source):
        username = source["username"]
        token_url = source["token_url"]

        return cls(username, token_url)
