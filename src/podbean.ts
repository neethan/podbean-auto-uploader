import { CsvEpisodeInformation } from "./csv.ts";
import * as globals from "./globals.ts";
import path from "path";
import fs from "fs";

// Set to true to create a draft episode instead of publishing
const CREATE_DRAFT = false;

/**
 * The structure of the Podbean token. Modified to include only relevant fields.
 */
export interface PodbeanToken {
  access_token: string;
  expires_in: number;
}


export type PodbeanEpisodeStatus = "publish" | "draft";
export type PodbeanEpisodeType = "public" | "premium" | "private";
export type PodbeanAppleEpisodeType = "full" | "trailer" | "bonus";
export type ContentExplicit = "clean" | "explicit";

/**
 * The structure of the episode information in Podbean
 */
export interface PodbeanEpisode {
  id: string;
  podcast_id: string;
  title: string;
  content: string;
  logo: string;
  media_url: string;
  player_url: string;
  permalink_url: string;
  publish_time: number;
  duration: number | null;
  status: PodbeanEpisodeStatus;
  type: PodbeanEpisodeType;
  season_number: number;
  episode_number: number;
  apple_episode_type: PodbeanAppleEpisodeType;
  transcripts_url: string;
  content_explicit: ContentExplicit;
  object: "Episode";
}

/**
 * The structure of the Podbean file upload authorization response
 */
export interface PodbeanFileUploadResponse {
  presigned_url: string;
  expire_in: number;
  file_key: string;
}

/**
 * The structure of the Podbean error response
 */
export interface PodbeanError {
  error: string;
  error_description: string;
}


/**
 * Checks an object is a PodbeanError
 * @param obj The object to check
 * @returns true if the object is a Podbean error
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isPodbeanError(obj: any): obj is PodbeanError {
  return obj.error !== undefined && obj.error_description !== undefined;
}

/**
 * Gets a new Podbean token
 * @returns The Podbean token or an error
 */
export async function getPodbeanToken(): Promise<PodbeanToken | PodbeanError> {
  const response = await fetch(`${globals.PODBEAN_API}/oauth/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${globals.PODBEAN_USER}:${globals.PODBEAN_PASS}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
    }),
  });

  if (!response.ok) {
    return (await response.json()) as PodbeanError;
  }

  const data = await response.json();

  return { access_token: data.access_token, expires_in: data.expires_in };
}

/**
 * Uploads a file to Podbean
 * @param token The Podbean token
 * @param filePath The path to the file to upload
 * @returns The file upload response or an error
 */
export async function uploadToPodbean(
  token: PodbeanToken,
  filePath: string
): Promise<PodbeanFileUploadResponse | PodbeanError> {
  const fileName = path.parse(filePath).base;
  const fileSize = fs.statSync(filePath).size;

  const params = new URLSearchParams({
    access_token: token.access_token,
    filename: fileName,
    filesize: fileSize.toString(),
    content_type: "audio/mpeg",
  });

  // Authorize upload
  const response = await fetch(`${globals.PODBEAN_API}/files/uploadAuthorize?${params}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  if (!response.ok) {
    return (await response.json()) as PodbeanError;
  }

  const data: PodbeanFileUploadResponse = await response.json();

  // Upload file to presigned URL
  const fileData = fs.readFileSync(filePath);
  const uploadResponse = await fetch(data.presigned_url, {
    method: "PUT",
    headers: {
      "Content-Type": "audio/mpeg",
    },
    body: fileData,
  });

  if (!uploadResponse.ok) {
    return (await response.json()) as PodbeanError;
  }

  return data;
}

/**
 * Creates a new episode in Podbean
 * @param token The Podbean token
 * @param audioFile The file upload response
 * @param epDetails The episode information
 * @returns The episode or an error
 */
export async function createNewEpisode(
  token: PodbeanToken,
  audioFile: PodbeanFileUploadResponse,
  epDetails: CsvEpisodeInformation
): Promise<PodbeanEpisode | PodbeanError> {
  const publishDate = Math.floor(Date.now() / 1000).toString();
  const params = new URLSearchParams({
    access_token: token.access_token,
    title: epDetails.title,
    content: epDetails.description,
    status: CREATE_DRAFT ? "draft" : "publish",
    type: "public",
    media_key: audioFile.file_key,
    apple_episode_type: "full",
    publish_timestamp: publishDate,
    content_explicit: "clean",
  });

  console.log(params.toString());

  // Create new episode using fetch()
  const response = await fetch(`${globals.PODBEAN_API}/episodes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });

  if (!response.ok) {
    return (await response.json()) as PodbeanError;
  }

  return (await response.json()).episode as PodbeanEpisode;
}
