import type { ErrorContext } from "./base-error";
import { BaseSwarmError } from "./base-error";

/**
 * Error thrown when task decomposition fails (e.g., file conflicts, invalid strategy).
 * Includes epic context and suggestions for resolving decomposition issues.
 */
export class DecompositionError extends BaseSwarmError {
	constructor(message: string, context?: Partial<ErrorContext>) {
		super(message, context);
		this.name = "DecompositionError";
	}
}
