# Podbean Auto Uploader

This is a simple script that watches a directory for new mp3 files and uploads them to Podbean using the Podbean API. The metadata for the podcast episode is fetched from a csv file.

This application was created for use at [Kristent Nettverk](https://krinet.no/)'s summer conference [Lys og Salt](http://lysogsalt.no/), as a simple way of quickly uploading sermons straight after a service during the conference, and to avoid a manual upload process for each episode. Log messages are therefore written in Norwegian, but the code and comments are in English.

## Installation

After cloning the repository, create a copy of the `.env.rename` file and rename it to `.env`. Fill in the required fields in the `.env` file. You'll need to create a Podbean account and a Podbean API key to use this script. The `PODCAST_LOCATION` field should point to the directory where the mp3 files are stored. The `CSV_LOCATION` field should point to the csv file containing the metadata for the podcast episodes.

Run the following command to install the required packages and start the application.

```bash
npm install
npm run app
```

## Usage

The script uses Chokidar to watch for new files in the `PODCAST_LOCATION` directory. When a new mp3 is detected, the script will upload the file to Podbean using the Podbean API.

The metadata for the podcast episode is partially hardcoded, but the title and description fields are fetched from an csv file as refered to by the `CSV_LOCATION` field in the `.env` file. The first row of the csv file is expected to be the header row: `title;description`. Each subsequent row should contain the title and description for the corresponding podcast episode, separated by a semicolon.

If the name of the mp3 file is `1.mp3`, the title and description for the podcast episode will be fetched from the first row of the csv file. If the name of the mp3 file is `2.mp3`, the title and description for the podcast episode will be fetched from the second row of the csv file, and so on.

## Contributing

This script was created for a specific use case, and as such, it is not very flexible. If you would like to contribute to this project, feel free to create a pull request or open an issue. :)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
