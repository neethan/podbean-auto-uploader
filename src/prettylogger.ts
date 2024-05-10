/* eslint-disable  @typescript-eslint/no-explicit-any */
import pc from "picocolors";

const { log } = console;

declare global {
  interface Console {
    success(message?: any, ...optionalParams: any[]): void;
  }
}
/**
 * A pretty nodejs logger that logs with colors, file names and line numbers.
 *
 * @example
 * ```ts
 * const prettyLogger = new PrettyLogger();
 * prettyLogger.init(process.env.NODE_ENV || "development");
 *
 * console.error("This is an error message");
 * console.warn("This is a warning message");
 * console.info("This is an info message");
 * console.success("This is a success message");
 * console.log("This is a log message");
 * ```
 */
export default class PrettyLogger {
  // The length of the padding for the line number
  private static PADDING_LENGTH = 13;

  /**
   * Gets the current file and line number of the called function
   *
   * @returns the file name and line number of the called function
   */
  private static getLineNumber(): string {
    const isWindows = process.platform === "win32";
    const delimiter = isWindows ? "\\" : "/";
    const line = ((new Error("log").stack.split("\n")[3] || "…").match(
      /\(([^)]+)\)/
    ) || ["", "not found"])[1];
    const fileAndLine =
      line.lastIndexOf(delimiter) > -1
        ? line.substring(line.lastIndexOf(delimiter) + 1, line.lastIndexOf(":"))
        : line;
    return pc.white(pc.italic(fileAndLine.padEnd(this.PADDING_LENGTH)));
  }

  /**
   * Various functions to log with colors, file names and line numbers. Styles each log method with a different color, based on the log level.
   * @param args the variables and other arguments to log
   */

  // Log error messages
  private consoleError(...args: any[]) {
    log.call(
      console.error,
      PrettyLogger.getLineNumber() + pc.red(pc.bold("   (error)")),
      ...args
    );
  }

  // Log success messages
  private consoleSuccess(...args: any[]) {
    log.call(
      console.log,
      PrettyLogger.getLineNumber() + pc.green(pc.bold(" (success)")),
      ...args
    );
  }

  // Log warning messages
  private consoleWarn(...args: any[]) {
    log.call(
      console.warn,
      PrettyLogger.getLineNumber() + pc.yellow(pc.bold("    (warn)")),
      ...args
    );
  }

  // Log info messages
  private consoleInfo(...args: any[]) {
    log.call(
      console.log,
      PrettyLogger.getLineNumber() + pc.cyan(pc.bold("    (info)")),
      ...args
    );
  }

  // Log log messages
  private consoleLog(...args: any[]) {
    log.call(
      console.log,
      PrettyLogger.getLineNumber() + pc.white(pc.bold("     (log)")),
      ...args
    );
  }

  /**
   * Initialize the logger with the given environment. When in development mode, the logger will log with colors, file names and line numbers.
   *
   * @param environment the environment to initialize the logger in. If set to "production", the logger will not log anything except for console.error and console.log.
   */
  public init(environment: string) {
    if (environment !== "production") {
      // Bind to console log functions
      console.error = this.consoleError;
      console.warn = this.consoleWarn;
      console.info = this.consoleInfo;
      console.success = this.consoleSuccess;
      console.log = this.consoleLog;
    } else {
      console.warn = console.info = console.success = () => {};
      console.log = this.consoleLog;
      console.error = this.consoleError;
    }
  }
}
