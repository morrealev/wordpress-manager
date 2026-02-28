/**
 * Check if a site has WP-CLI access configured (wp_path and optionally ssh_host).
 */
export declare function hasWpCli(siteId?: string): boolean;
/**
 * Check if a site is configured as multisite.
 */
export declare function isMultisite(siteId?: string): boolean;
/**
 * Execute a WP-CLI command for a given site.
 *
 * - If ssh_host is set: runs via SSH
 * - If only wp_path is set: runs locally
 * - Appends --format=json by default for structured output
 *
 * @param command WP-CLI command without the leading "wp " (e.g., "site list", "plugin activate hello --network")
 * @param siteId Site ID (defaults to active site)
 * @param options.skipJson Don't append --format=json (for commands that don't support it)
 * @returns stdout as string
 */
export declare function executeWpCli(command: string, siteId?: string, options?: {
    skipJson?: boolean;
}): Promise<string>;
