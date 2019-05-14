import argparse
import json
from datetime import datetime, timedelta

import pytz
from core_data_modules.logging import Logger
from dateutil.parser import isoparse
from rapid_pro_tools.rapid_pro_client import RapidProClient
from storage.google_cloud import google_cloud_utils

from src import FirestoreWrapper
from src.data_models import SMSStats

Logger.set_project_name("OpsDashboard")
log = Logger(__name__)

UPDATE_RESOLUTION = timedelta(minutes=10)


def floor_timestamp_at_resolution(dt, resolution):
    """
    :param dt:
    :type dt: datetime.datetime
    :param resolution:
    :type resolution: datetime.timedelta
    :return:
    :rtype: datetime.datetime
    """
    assert resolution.total_seconds() < timedelta(days=1).total_seconds()

    day = datetime(dt.year, dt.month, dt.day, tzinfo=dt.tzinfo)
    seconds_today = (dt - day).total_seconds()
    floored_seconds_today = (seconds_today // resolution.total_seconds()) * resolution.total_seconds()

    return day + timedelta(seconds=floored_seconds_today)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Updates the incoming/outgoing/errored message counts for the "
                                                 "currently active projects over the requested time range. "
                                                 "Active projects are read from Firestore")

    parser.add_argument("google_cloud_credentials_file_path", metavar="google-cloud-credentials-file-path",
                        help="Path to a Google Cloud service account credentials file to use to access the "
                             "credentials bucket")
    parser.add_argument("firestore_credentials_url", metavar="firestore-credentials-url",
                        help="GS URL to the credentials file to use to access the Firestore instance with "
                             "the operations statistics")
    parser.add_argument("start_time_inclusive", metavar="start-time-inclusive",
                        help="ISO 8601 string for the start of the datetime range to update sms statistics for")
    parser.add_argument("end_time_exclusive", metavar="end-time-inclusive",
                        help="ISO 8601 string for the end of the datetime range to update sms statistics for ")

    args = parser.parse_args()

    google_cloud_credentials_file_path = args.google_cloud_credentials_file_path
    firestore_credentials_url = args.firestore_credentials_url
    start_time_inclusive = isoparse(args.start_time_inclusive).astimezone(pytz.utc)
    end_time_exclusive = isoparse(args.end_time_exclusive).astimezone(pytz.utc)

    assert start_time_inclusive == floor_timestamp_at_resolution(start_time_inclusive, UPDATE_RESOLUTION), \
        f"Start time {start_time_inclusive.isoformat()} is not a multiple of the update resolution {UPDATE_RESOLUTION}"
    assert end_time_exclusive == floor_timestamp_at_resolution(end_time_exclusive, UPDATE_RESOLUTION), \
        f"End time {end_time_exclusive.isoformat()} is not a multiple of the update resolution {UPDATE_RESOLUTION}"

    log.info("Initialising the Firestore client...")
    firestore_credentials = json.loads(google_cloud_utils.download_blob_to_string(
            google_cloud_credentials_file_path, firestore_credentials_url))
    firestore_wrapper = FirestoreWrapper(firestore_credentials)

    log.info("Downloading the active project details from Firestore...")
    active_projects = firestore_wrapper.get_active_projects()
    log.info(f"Downloaded the details for {len(active_projects)} active projects")

    for project in active_projects:
        log.info(f"Computing SMS statistics for project {project.project_name}...")

        log.info(f"Downloading the Rapid Pro credentials token from '{project.rapid_pro_token_url}'...")
        rapid_pro_token = google_cloud_utils.download_blob_to_string(
            google_cloud_credentials_file_path, project.rapid_pro_token_url).strip()

        log.info(f"Downloading raw messages from Rapid Pro...")
        rapid_pro = RapidProClient(project.rapid_pro_domain, rapid_pro_token)
        raw_messages = rapid_pro.get_raw_messages(created_after_inclusive=start_time_inclusive,
                                                  created_before_exclusive=end_time_exclusive)

        log.info("Computing message stats for each minute...")
        # Create a table of counts for all the minutes of interest, with all counts initialised to 0
        stats = dict()  # of minute iso_string -> SMSStats
        interval = start_time_inclusive
        while interval < end_time_exclusive:
            stats[interval.isoformat()] = SMSStats(interval)
            interval += UPDATE_RESOLUTION

        # Loop over all of the downloaded messages and increment the appropriate count
        unhandled_status_count = 0
        for msg in raw_messages:
            interval_stats = stats[
                floor_timestamp_at_resolution(msg.created_on, UPDATE_RESOLUTION).astimezone(pytz.utc).isoformat()]

            # Message statuses are "documented" here:
            # https://github.com/rapidpro/rapidpro/blob/c972205aae29f7219582fc29478e8ecacb579f9f/temba/msgs/models.py#L79
            if msg.direction == "in":
                interval_stats.total_received += 1
                continue

            assert msg.direction == "out", f"Expected msg.direction to be either 'in' or 'out', but was {msg.direction}"

            if msg.status in {"initializing", "pending", "queued"}:
                interval_stats.total_pending += 1
            elif msg.status in {"wired", "sent", "delivered", "resent"}:
                interval_stats.total_sent += 1
            elif msg.status in {"errored", "failed"}:
                interval_stats.total_errored += 1
            else:
                unhandled_status_count += 1
                log.warning(f"Unexpected message status '{msg.status}'")

        if unhandled_status_count > 0:
            log.warning(f"Exported data contained {unhandled_status_count} unhandled message statuses.")

        log.info("Uploading message stats to Firestore...")
        firestore_wrapper.update_sms_stats_batch(project.project_name, stats)

        log.info(f"Completed updating the SMS statistics for project {project.project_name}")
