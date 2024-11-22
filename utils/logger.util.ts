import { createLogger, format, transports, Logger as WinstonLogger } from "winston";
import dotenv from "dotenv";

// importing environment configurations
dotenv.config();

// Define types for the custom format
interface CustomFormatInfo {
  level: string;
  message: string;
  timestamp: string;
  functionName: string;
}

export default class Logger {
  private logger: WinstonLogger;

  constructor() {
    this.logger = this.initializeLogger();
  }

  // Custom format for console development logger
  private customFormat() {
    return format.printf((info: any) => {
      return `[${info.timestamp}] [${info.level}] (${info.functionName}): ${info.message}`;
    });
  }

  // Method to initialize the logger based on environment
  private initializeLogger(): WinstonLogger {
    const devLogger = createLogger({
      transports: [new transports.Console()],
      level: "info",
      format: format.combine(
        format.colorize(),
        format.timestamp({ format: "DD-MM-YYYY HH:mm:ss" }),
        format.errors({ stack: true }),
        this.customFormat()
      ),
    });

    const prodLogger = createLogger({
      transports: [new transports.Console()],
      level: "info",
      format: format.combine(
        format.timestamp(),
        format.errors({ stack: false }),
        format.prettyPrint()
      ),
    });

    if (process.env.ENVIRONMENT === "development") {
      return devLogger;
    } else {
      return prodLogger;
    }
  }

  // Additional methods for specific log levels
  info(message: string, functionName: string): void {
    this.logger.info({ message, functionName });
  }

  warn(message: string, functionName: string): void {
    this.logger.warn({ message, functionName });
  }

  error(message: string, functionName: string): void {
    this.logger.error({ message, functionName });
  }
}