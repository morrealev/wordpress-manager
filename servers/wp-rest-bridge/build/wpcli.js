// src/wpcli.ts - WP-CLI execution module (local + SSH)
import { exec } from 'node:child_process';
import { getSiteConfig, getActiveSite, logToStderr } from './wordpress.js';
const WPCLI_TIMEOUT_MS = 30000;
/**
 * Check if a site has WP-CLI access configured (wp_path and optionally ssh_host).
 */
export function hasWpCli(siteId) {
    const config = getSiteConfig(siteId || getActiveSite());
    if (!config)
        return false;
    return !!config.wp_path;
}
/**
 * Check if a site is configured as multisite.
 */
export function isMultisite(siteId) {
    const config = getSiteConfig(siteId || getActiveSite());
    if (!config)
        return false;
    return !!config.is_multisite;
}
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
export async function executeWpCli(command, siteId, options) {
    const id = siteId || getActiveSite();
    const config = getSiteConfig(id);
    if (!config) {
        throw new Error(`Site "${id}" not found in configuration.`);
    }
    if (!config.wp_path) {
        throw new Error(`WP-CLI not configured for site "${id}". ` +
            `Add wp_path to WP_SITES_CONFIG for this site.`);
    }
    const formatFlag = options?.skipJson ? '' : ' --format=json';
    const wpCommand = `wp ${command}${formatFlag}`;
    let shellCommand;
    if (config.ssh_host) {
        // Remote execution via SSH
        const sshUser = config.ssh_user || 'root';
        const sshPort = config.ssh_port || 22;
        const sshKeyFlag = config.ssh_key ? `-i ${config.ssh_key} ` : '';
        const escapedCommand = `cd ${config.wp_path} && ${wpCommand}`;
        shellCommand = `ssh ${sshKeyFlag}-p ${sshPort} -o StrictHostKeyChecking=accept-new -o ConnectTimeout=10 ${sshUser}@${config.ssh_host} '${escapedCommand}'`;
    }
    else {
        // Local execution
        shellCommand = `cd ${config.wp_path} && ${wpCommand}`;
    }
    logToStderr(`[${id}] WP-CLI: ${wpCommand}`);
    return new Promise((resolve, reject) => {
        exec(shellCommand, { timeout: WPCLI_TIMEOUT_MS }, (error, stdout, stderr) => {
            if (error) {
                const msg = stderr?.trim() || error.message;
                logToStderr(`[${id}] WP-CLI error: ${msg}`);
                reject(new Error(`WP-CLI error on site "${id}": ${msg}`));
                return;
            }
            resolve(stdout.trim());
        });
    });
}
