import 'dotenv/config';

// Folder to watch for new mp3 files
export const PODCAST_LOCATION = process.env.PODCAST_LOCATION!;

// Folder to move finished files to
export const PODCAST_LOCATION_FINISHED = process.env.PODCAST_LOCATION_FINISHED!;

// Podbean client_id
export const PODBEAN_USER = process.env.PODBEAN_USER!;

// Podbean client_secret
export const PODBEAN_PASS = process.env.PODBEAN_PASS!;

// Podbean API URL
export const PODBEAN_API = process.env.PODBEAN_API!;

// Location of the csv file with episode information
export const CSV_LOCATION = process.env.CSV_LOCATION!;