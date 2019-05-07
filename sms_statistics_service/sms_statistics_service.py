import argparse
import datetime
import json

import pytz
from core_data_modules.logging import Logger
from dateutil.parser import isoparse
from rapid_pro_tools.rapid_pro_client import RapidProClient
from storage.google_cloud import google_cloud_utils

from src import FirestoreClient, Cache
from src.data_models import SMSStats

Logger.set_project_name("OpsDashboard")
log = Logger(__name__)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Updates the incoming/outgoing/errored message counts for the "
                                                 "currently active projects over the requested time range. "
                                                 "Active projects are read from Firestore")

    parser.add_argument("cache_dir", metavar="cache-dir",
                        help="Directory to cache downloaded active projects and Rapid Pro tokens in")
    parser.add_argument("google_cloud_credentials_file_path", metavar="google-cloud-credentials-file-path",
                        help="Path to a Google Cloud service account credentials file to use to access the "
                             "credentials bucket")
    parser.add_argument("firestore_credentials_url", metavar="firestore-credentials-url",
                        help="GS URL to the credentials file to use to access the Firestore instance containing "
                             "the operations statistics")
    parser.add_argument("start_minute_inclusive", metavar="start-minute-inclusive",
                        help="ISO 8601 string for the start of the datetime range to update sms statistics for")
    parser.add_argument("end_minute_exclusive", metavar="end-minute-inclusive",
                        help="ISO 8601 string for the end of the datetime range to update sms statistics for ")

    args = parser.parse_args()

    cache_dir = args.cache_dir
    google_cloud_credentials_file_path = args.google_cloud_credentials_file_path
    firestore_credentials_url = args.firestore_credentials_url
    start_minute_inclusive = isoparse(args.start_minute_inclusive)
    end_minute_exclusive = isoparse(args.end_minute_exclusive)

    assert start_minute_inclusive.second == 0
    assert start_minute_inclusive.microsecond == 0
    assert end_minute_exclusive.second == 0
    assert end_minute_exclusive.microsecond == 0

    log.info("Initialising the Firestore client...")
    firestore_credentials = json.loads(google_cloud_utils.download_blob_to_string(
            google_cloud_credentials_file_path, firestore_credentials_url))
    firestore_client = FirestoreClient(firestore_credentials)

    log.info("Initialising the cache...")
    cache = Cache(cache_dir)

    log.info("Loading the active project details...")
    active_projects = cache.get_active_projects(firestore_client)
    log.info(f"Loaded the details for {len(active_projects)} active projects")

    for project in active_projects:
        log.info(f"Computing SMS statistics for project {project.project_name}...")

        log.info("Loading the Rapid Pro token...")
        rapid_pro_token = cache.get_rapid_pro_token_for_project(
            project.project_name, google_cloud_credentials_file_path, project.rapid_pro_token_url)
        log.info("Loaded the Rapid Pro token")

        log.info(f"Downloading raw messages from Rapid Pro...")
        rapid_pro = RapidProClient(project.rapid_pro_domain, rapid_pro_token)
        raw_messages = rapid_pro.get_raw_messages(created_after_inclusive=start_minute_inclusive,
                                                  created_before_exclusive=end_minute_exclusive)

        log.info("Computing message stats for each minute...")
        # Create a table of counts for all the minutes of interest, with all counts initialised to 0
        stats = dict()  # of minute iso_string -> SMSStats
        minute = start_minute_inclusive
        while minute < end_minute_exclusive:
            stats[minute.astimezone(pytz.utc).isoformat(timespec="minutes")] = SMSStats()
            minute += datetime.timedelta(minutes=1)

        # Loop over all of the downloaded messages and increment the appropriate count
        unhandled_status_count = 0
        for msg in raw_messages:
            minute_stats = stats[msg.created_on.astimezone(pytz.utc).isoformat(timespec="minutes")]

            if msg.direction == "in":
                minute_stats.total_received += 1
            elif msg.direction == "out":
                if msg.status == "errored" or msg.status == "failed":
                    minute_stats.total_errored += 1
                elif msg.status == "wired":
                    minute_stats.total_sent += 1
                else:
                    unhandled_status_count += 1
                    log.warning(f"Unexpected message status '{msg.status}'")
            else:
                unhandled_status_count += 1
                log.warning(f"Unexpected message direction '{msg.direction}'")

        if unhandled_status_count > 0:
            log.warning(f"Exported data contained {unhandled_status_count} unhandled message statuses.")

        log.info("Uploading message stats to Firestore...")
        firestore_client.update_sms_stats(project.project_name, stats)

        log.info(f"Completed updating the SMS statistics for project {project.project_name}")
