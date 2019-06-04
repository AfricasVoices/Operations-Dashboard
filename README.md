# Operations-Dashboard

## Usage

### Generate SMS Statistics
To produce counts of received, sent, and failed messages for each project:

#### 1. Configure the Active Projects
The statistics script automatically determines which projects to update by reading from the `active_projects`
collection in Firestore.

To add a new project, add a new document to `active_projects` with the following fields:
- `project_name: string`: Project name.
- `rapid_pro_domain: string`: Domain of the instance of Rapid Pro for this project.
- `rapid_pro_token_url: string`: GS URL to the credentials file containing the the Rapid Pro access token for this
  project's organisation.
- `operator_names: array of string`: The names of all the operators of interest. The outputted SMS stats will contain
  counts for all of these operators in each document. (plus one-off inclusions of any other observed operators).

#### 2. Run the SMS statistics service
Two scripts are available to update the received/sent/failed counts for all of the projects which were defined 
as active in the previous step. `docker-run.sh` is intended for one-off updates and is described first;
`docker-run-incremental.sh` is intended for incremental, automated updates.

To perform a one-off update over a time-range, use:

```
$ ./docker-run.sh <cache-volume-name> <google-cloud-credentials-file-path> <firestore-credentials-url> <start-time-inclusive> <end-time-exclusive>
```

where:
- `cache-volume-name` is the name of the volume to use to to cache the active projects and their Rapid Pro tokens.
  If the requested volume does not exist, it will be created automatically, and populated with cached data on the first
  run. Subsequent runs of the this script will read from the cache instead of Firestore/Google Cloud Storage.
  To clear the cache, delete the volume using `$ docker volume rm <cache-volume-name>`.
- `google-cloud-credentials-file-path` is an absolute path to a json file containing the private key credentials
  for accessing a cloud storage credentials bucket containing all the other project credentials files.
- `firestore-credentials-url` is a GS URL to the credentials file to use to access the Firestore instance containing 
  the operations statistics.
- `start-time-inclusive` is an ISO 8601 string for the start of the datetime range to update sms statistics for.
- `end-time-inclusive` is an ISO 8601 string for the end of the datetime range to update sms statistics for.

To incrementally update with messages received since the last update, use the following command.
Run this script repeatedly at set intervals to achieve incremental updating.
```
$ ./docker-run-incremental.sh <cache-volume-name> <google-cloud-credentials-file-path> <firestore-credentials-url> <last-update-file-path>
```

where:
- `cache-volume-name` is the name of the volume to use to to cache the active projects and their Rapid Pro tokens.
  If the requested volume does not exist, it will be created automatically, and populated with cached data on the first
  run. Subsequent runs of the this script will read from the cache instead of Firestore/Google Cloud Storage.
  To clear the cache, delete the volume using `$ docker volume rm <cache-volume-name>`.
- `google-cloud-credentials-file-path` is an absolute path to a json file containing the private key credentials
  for accessing a cloud storage credentials bucket containing all the other project credentials files.
- `firestore-credentials-url` is a GS URL to the credentials file to use to access the Firestore instance containing 
  the operations statistics.
- `last-update-file-path` is an absolute path to a file that contains an ISO 8601 string for the time to start 
  updating from. On successful update of the statistics, this file will be overwritten with the end timestamp for 
  this update (i.e. the time when this script was started).
 

<!--
### Generate Coda Statistics
TODO

### Visualisation
TODO?
-->
