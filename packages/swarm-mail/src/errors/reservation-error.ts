import type { ErrorContext } from "./base-error";
import { BaseSwarmError } from "./base-error";

/**
 * Error thrown when file reservation conflicts occur.
 * Includes information about current holder for coordination.
 */
export class ReservationError extends BaseSwarmError {
	constructor(message: string, context?: Partial<ErrorContext>) {
		super(message, context);
		this.name = "ReservationError";
	}
}
