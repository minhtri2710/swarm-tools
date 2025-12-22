import type { ErrorContext } from "./base-error";
import { BaseSwarmError } from "./base-error";

/**
 * Error thrown when validation fails (e.g., invalid epic structure, bad input).
 * Includes suggestions for fixing validation issues.
 */
export class ValidationError extends BaseSwarmError {
	constructor(message: string, context?: Partial<ErrorContext>) {
		super(message, context);
		this.name = "ValidationError";
	}
}
