import pytz


class SMSStats(object):
    def __init__(self, datetime, total_received=0, total_sent=0, total_pending=0, total_errored=0):
        self.datetime = datetime
        self.total_received = total_received
        self.total_sent = total_sent
        self.total_pending = total_pending
        self.total_errored = total_errored
        # TODO: per-operator counts

    def to_dict(self):
        return {
            "datetime": self.datetime.astimezone(pytz.utc),
            "total_received": self.total_received,
            "total_sent": self.total_sent,
            "total_pending": self.total_pending,
            "total_errored": self.total_errored
        }
