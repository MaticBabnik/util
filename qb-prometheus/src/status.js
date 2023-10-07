const statuses = {
    "error": { active: false, error: true },               // Some error occurred, applies to paused torrents
    "missingFiles": { active: false, error: true },        // Torrent data files is missing
    "uploading": { active: true, error: false },           // Torrent is being seeded and data is being transferred
    "pausedUP": { active: false, error: false },           // Torrent is paused and has finished downloading
    "queuedUP": { active: false, error: false },           // Queuing is enabled and torrent is queued for upload
    "stalledUP": { active: true, error: false },           // Torrent is being seeded, but no connection were made
    "checkingUP": { active: false, error: false },         // Torrent has finished downloading and is being checked
    "forcedUP": { active: false, error: false },           // Torrent is forced to uploading and ignore queue limit
    "allocating": { active: false, error: false },         // Torrent is allocating disk space for download
    "downloading": { active: true, error: false },         // Torrent is being downloaded and data is being transferred
    "metaDL": { active: false, error: false },             // Torrent has just started downloading and is fetching metadata
    "pausedDL": { active: false, error: false },           // Torrent is paused and has NOT finished downloading
    "queuedDL": { active: false, error: false },           // Queuing is enabled and torrent is queued for download
    "stalledDL": { active: false, error: false },          // Torrent is being downloaded, but no connection were made
    "checkingDL": { active: false, error: false },         // Same as checkingUP, but torrent has NOT finished downloading
    "forcedDL": { active: true, error: false },            // Torrent is forced to downloading to ignore queue limit
    "checkingResumeData": { active: false, error: false }, // Checking resume data on qBt startup
    "moving": { active: false, error: false },             // Torrent is moving to another location
    "unknown": { active: false, error: false },            // ????
}

module.exports = statuses;