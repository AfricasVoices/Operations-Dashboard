class ActiveProject(object):
    def __init__(self, project_name, rapid_pro_domain, rapid_pro_token_url):
        self.project_name = project_name
        self.rapid_pro_domain = rapid_pro_domain
        self.rapid_pro_token_url = rapid_pro_token_url

    def to_dict(self):
        return {
            "project_name": self.project_name,
            "rapid_pro_domain": self.rapid_pro_domain,
            "rapid_pro_token_url": self.rapid_pro_token_url
        }

    @classmethod
    def from_dict(cls, source):
        project_name = source["project_name"]
        rapid_pro_domain = source["rapid_pro_domain"]
        rapid_pro_token_url = source["rapid_pro_token_url"]

        return cls(project_name, rapid_pro_domain, rapid_pro_token_url)
