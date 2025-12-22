import type { ErrorContext } from "./base-error";
import { BaseSwarmError } from "./base-error";

/**
 * Error thrown when checkpoint operations fail.
 * Includes sequence number and recent events for debugging.
 */
export class CheckpointError extends BaseSwarmError {
	constructor(message: string, context?: Partial<ErrorContext>) {
		super(message, context);
		this.name = "CheckpointError";
	}
}
