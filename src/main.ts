import chokidar from "chokidar";
import { existsSync, rename } from "fs";
import path, { join } from "path";
import pc from "picocolors";
import { fetchEpisodeInfo } from "./csv.ts";
import * as globals from "./globals.ts";
import { createNewEpisode, getPodbeanToken, isPodbeanError, uploadToPodbean } from "./podbean.ts";
import PrettyLogger from "./prettylogger.ts";

async function main() {
  const prettyLogger = new PrettyLogger();

  console.clear();

  console.log(pc.bold("Automagisk podkastopplastingsprogram av Neethan Puvanendran for Kristent Nettverk\n"));
  console.log("Podcast mappe: " + globals.PODCAST_LOCATION);
  console.log("Podcast ferdig mappe: " + globals.PODCAST_LOCATION_FINISHED);
  console.log("Podcast CSV fil: " + globals.CSV_LOCATION + "\n");
  console.log("Husk å eksporter filene fra Reaper/opptaksprogrammet med riktig navn!");
  console.log(
    "F.eks. 1.mp3, 2.mp3, 3.mp3 osv. 1 er da første rad etter overskriftene. \nHvert møte skal ha en tilhørende rad i CSV filen.\n"
  );
  console.log("Trykk CTRL + C for å avslutte programmet.\n-----------");

  prettyLogger.init("development");

  console.info("Henter ny token fra Podbean...");
  let token = await getPodbeanToken();
  let tokenTimestamp = new Date().getTime() / 1000;
  if (isPodbeanError(token)) {
    console.error(`Kunne ikke hente token: ${token.error_description}`);
    process.exit(1);
  }
  console.success("Token hentet!");
  console.info("Nå venter vi på at filer skal bli lagt til i mappen: " + globals.PODCAST_LOCATION + "...\n");

  // Listen for files added to PODCAST_LOCATION
  const watcher = chokidar.watch(globals.PODCAST_LOCATION, {
    ignored: /^\./,
    persistent: true,
    ignoreInitial: true,
  });

  watcher.on("add", async (filePath) => {
    console.info(pc.bold("Fil har blitt lagt til i mappen!"));

    if (isPodbeanError(token)) {
      console.warn("-> Podbean token ugyldig, henter ny token");
      token = await getPodbeanToken();
      tokenTimestamp = new Date().getTime() / 1000;
      if (isPodbeanError(token)) {
        console.error(`--> Kunne ikke hente token: ${token.error_description}`);
        return;
      }
      console.success("--> Fikk ny token!");
    }

    const filename = path.parse(filePath).base;

    if (filename.endsWith(".mp3")) {
      console.info(`-> Gyldig MP3: ${filename}`);
      // Check if file is already uploaded (exists in finished folder)
      if (existsSync(join(globals.PODCAST_LOCATION_FINISHED, filename))) {
        console.warn(`--> Filen ${filename} er allerede lastet opp, ignorerer...`);
        return;
      }

      const filePath = join(globals.PODCAST_LOCATION, filename);
      const finishedFilePath = join(globals.PODCAST_LOCATION_FINISHED, filename);

      // Check if token is expired
      if (new Date().getTime() / 1000 - tokenTimestamp > token.expires_in) {
        console.warn("-> Podbean token ugyldig, henter ny token");
        token = await getPodbeanToken();
        tokenTimestamp = new Date().getTime() / 1000;
        if (isPodbeanError(token)) {
          console.error(`--> Kunne ikke hente token: ${token.error_description}`);
          return;
        }
        console.success("--> Hentet ny token!");
      }
      // Check if filename can be parsed to an int
      const episodeIndex = parseInt(filename.split(".")[0]);
      if (isNaN(episodeIndex)) {
        console.error(`--> Ugyldig filnavn: ${filename}. Filnavn må være et tall etterfulgt av .mp3`);
        return;
      }
      console.info(`-> Henter episode informasjon fra csv fil for episode ${episodeIndex}`);
      const episodeDetails = await fetchEpisodeInfo(episodeIndex).catch((err) => {
        console.error(`--> Kunne ikke hente episode informasjon: ${err}`);
        return;
      });
      if (!episodeDetails) {
        return;
      }
      console.success(`--> Episode informasjon hentet: ${episodeDetails.title}`);

      // Upload file using podbean
      console.info("-> Laster opp fil til Podbean...");
      const fileUploadResponse = await uploadToPodbean(token, filePath);
      if (isPodbeanError(fileUploadResponse)) {
        console.error(`--> Kunne ikke laste opp mp3 fil: ${fileUploadResponse.error_description}`);
        return;
      }
      console.success("-> Fil lastet opp til Podbean: " + fileUploadResponse.file_key);

      // Wait for 5 seconds
      console.info("-> Venter 5 sekunder på at lydfilen skal være ferdig prosessert...");
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Create new episode on Podbean
      console.info("-> Lager ny episode på Podbean...");
      const newEpisodeResponse = await createNewEpisode(token, fileUploadResponse, episodeDetails);
      if (isPodbeanError(newEpisodeResponse)) {
        console.error(`--> Kunne ikke lage ny episode: ${newEpisodeResponse.error_description}`);
        return;
      }
      console.success("-> Episode publisert på Podbean: " + newEpisodeResponse.permalink_url);

      // Move file to finished folder
      rename(filePath, finishedFilePath, (err) => {
        if (err) {
          console.error(`-> Kunne ikke flytte mp3 til finished mappen: ${err}`);
          return;
        }
        console.success(`-> Flyttet ${filename} til finished mappen\n`);
      });
    } else {
      console.warn(`-> Ikke MP3: ${filename}`);
    }
  });
}

main();
