import pytz


class AfricasTalkingStats(object):
    def __init__(self, datetime, balance):
        """
        :param datetime: Datetime that the stats in this object cover.
        :type datetime: datetime.datetime
        :param balance: Balance.
        :type balance: str
        """
        self.datetime = datetime
        self.balance = balance

    def to_dict(self):
        return {
            "datetime": self.datetime.astimezone(pytz.utc).isoformat(),
            "balance": self.balance
        }
