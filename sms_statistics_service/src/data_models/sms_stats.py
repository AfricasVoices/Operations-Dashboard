class SMSOperatorStats(object):
    def __init__(self, received=0, sent=0):
        """
        :param received: Number of messages received via this operator.
        :type received: int
        :param sent: Number of messages sent via this operator.
        :type sent: int
        """
        self.received = received
        self.sent = sent

    def to_dict(self):
        return {
            "received": self.received,
            "sent": self.sent
        }

    @classmethod
    def from_dict(cls, source):
        received = source["received"]
        sent = source["sent"]

        return cls(received, sent)


class SMSStats(object):
    def __init__(self, total_received=0, total_sent=0, total_errored=0, operators=None):
        """
        :param total_received: Total number of messages received, across all operators.
        :type total_received: int
        :param total_sent: Total number of messages sent, across all operators.
        :type total_sent: int
        :param total_errored: Total number of messages which failed, to send across all operators.
        :type total_errored: int
        :param operators: Dictionary of operator name to operator stats.
        :type operators: dict of str -> SMSOperatorStats
        """
        if operators is None:
            operators = dict()

        self.total_received = total_received
        self.total_sent = total_sent
        self.total_errored = total_errored
        self.operators = operators

    def to_dict(self):
        return {
            "total_received": self.total_received,
            "total_sent": self.total_sent,
            "total_errored": self.total_errored,
            "operators": {operator_name: operator_stats.to_dict()
                          for operator_name, operator_stats in self.operators.items()}
        }

    @classmethod
    def from_dict(cls, source):
        total_received = source["total_received"]
        total_sent = source["total_sent"]
        total_errored = source["total_errored"]
        operators = source["operators"]

        return cls(total_received, total_sent, total_errored, operators)
