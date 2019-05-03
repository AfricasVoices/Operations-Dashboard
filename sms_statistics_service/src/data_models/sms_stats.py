class SMSStats(object):
    def __init__(self, total_received=0, total_sent=0, total_errored=0):
        self.total_received = total_received
        self.total_sent = total_sent
        self.total_errored = total_errored
        # TODO: per-operator counts

    def to_dict(self):
        return {
            "total_received": self.total_received,
            "total_sent": self.total_sent,
            "total_errored": self.total_errored
        }

    @classmethod
    def from_dict(cls, source):
        total_received = source["total_received"]
        total_sent = source["total_sent"]
        total_errored = source["total_errored"]

        return cls(total_received, total_sent, total_errored)
