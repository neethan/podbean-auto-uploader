import { parse } from "csv-parse/sync";
import { promises as fs } from "fs";
import { CSV_LOCATION } from "./globals.ts";

/**
 * The structure of the episode information in the csv file
 */
export interface CsvEpisodeInformation {
  title: string;
  description: string;
}

/**
 * Fetches episode information from the csv file
 *
 * @param index The index of the episode
 * @returns The episode information
 */
export async function fetchEpisodeInfo(index: number) {
  const content = await fs.readFile(`${CSV_LOCATION}`, "utf-8");
  const records = parse(content, {
    columns: ["title", "description"],
    skip_empty_lines: true,
    delimiter: ";",
    from_line: 1,
  });
  if (records.info.lines > index) {
    throw new Error(`Episode ${index} does not exist in the csv file`);
  }
  return (records[index] as CsvEpisodeInformation);
}
