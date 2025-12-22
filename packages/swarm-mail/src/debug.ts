import debug from "debug";

/**
 * Debug logging for swarm coordination subsystems.
 * Enable with DEBUG environment variable:
 *
 * - DEBUG=swarm:* - Enable all subsystems
 * - DEBUG=swarm:events - Enable only events
 * - DEBUG=swarm:events,swarm:messages - Enable multiple subsystems
 *
 * For human developers debugging swarms. AI agents should use structured errors + state dumps instead.
 * Console output goes to AI context and causes bloat.
 */
export const log = {
	events: debug("swarm:events"),
	reservations: debug("swarm:reservations"),
	messages: debug("swarm:messages"),
	checkpoints: debug("swarm:checkpoints"),
};
