import { makeWooCommerceRequest } from '../wordpress.js';
import { z } from 'zod';
const wcListPaymentGatewaysSchema = z.object({}).strict();
const wcListShippingZonesSchema = z.object({}).strict();
const wcGetTaxClassesSchema = z.object({}).strict();
const wcGetSystemStatusSchema = z.object({}).strict();
export const wcSettingTools = [
    {
        name: "wc_list_payment_gateways",
        description: "Lists all configured WooCommerce payment gateways with status and settings",
        inputSchema: { type: "object", properties: wcListPaymentGatewaysSchema.shape },
    },
    {
        name: "wc_list_shipping_zones",
        description: "Lists WooCommerce shipping zones with methods and regions",
        inputSchema: { type: "object", properties: wcListShippingZonesSchema.shape },
    },
    {
        name: "wc_get_tax_classes",
        description: "Gets WooCommerce tax classes configuration",
        inputSchema: { type: "object", properties: wcGetTaxClassesSchema.shape },
    },
    {
        name: "wc_get_system_status",
        description: "Gets WooCommerce system status (version, environment, database, theme, plugins)",
        inputSchema: { type: "object", properties: wcGetSystemStatusSchema.shape },
    },
];
export const wcSettingHandlers = {
    wc_list_payment_gateways: async () => {
        try {
            const response = await makeWooCommerceRequest("GET", "payment_gateways");
            return { toolResult: { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] } };
        }
        catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            return { toolResult: { isError: true, content: [{ type: "text", text: `Error listing payment gateways: ${errorMessage}` }] } };
        }
    },
    wc_list_shipping_zones: async () => {
        try {
            const response = await makeWooCommerceRequest("GET", "shipping/zones");
            return { toolResult: { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] } };
        }
        catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            return { toolResult: { isError: true, content: [{ type: "text", text: `Error listing shipping zones: ${errorMessage}` }] } };
        }
    },
    wc_get_tax_classes: async () => {
        try {
            const response = await makeWooCommerceRequest("GET", "taxes/classes");
            return { toolResult: { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] } };
        }
        catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            return { toolResult: { isError: true, content: [{ type: "text", text: `Error getting tax classes: ${errorMessage}` }] } };
        }
    },
    wc_get_system_status: async () => {
        try {
            const response = await makeWooCommerceRequest("GET", "system_status");
            return { toolResult: { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] } };
        }
        catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            return { toolResult: { isError: true, content: [{ type: "text", text: `Error getting system status: ${errorMessage}` }] } };
        }
    },
};
