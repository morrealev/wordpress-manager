# Order Workflow

WooCommerce orders follow a defined lifecycle from initial placement through fulfillment or cancellation. Understanding valid status transitions, order notes, and refund processes is essential for efficient store operations.

## MCP Tools

| Tool | Usage |
|------|-------|
| `wc_list_orders` | List/filter orders by status, date, customer, or product |
| `wc_get_order` | Get full order details including line items, billing, shipping |
| `wc_update_order_status` | Transition order to a new status |
| `wc_list_order_notes` | List all notes (internal and customer-visible) on an order |
| `wc_create_order_note` | Add a note to an order |
| `wc_create_refund` | Create a partial or full refund for an order |

## Order Status Lifecycle

```
pending → processing → completed
    ↓          ↓
 cancelled   on-hold
              ↓
           refunded
              ↓
            failed
```

| Status | Meaning |
|--------|---------|
| `pending` | Payment not yet received |
| `processing` | Payment received, awaiting fulfillment |
| `on-hold` | Awaiting payment confirmation (bank transfer) |
| `completed` | Order fulfilled and shipped |
| `cancelled` | Cancelled by customer or admin |
| `refunded` | Fully refunded |
| `failed` | Payment failed or declined |

## Valid Status Transitions

- `pending` → `processing`, `on-hold`, `cancelled`, `failed`
- `processing` → `completed`, `on-hold`, `cancelled`, `refunded`
- `on-hold` → `processing`, `cancelled`
- `completed` → `refunded` (via `wc_create_refund`)
- Any status → `cancelled` (with care — triggers stock restore)

## Filtering Orders

```json
// Recent processing orders
{ "status": "processing", "per_page": 50, "orderby": "date", "order": "desc" }

// Orders by date range
{ "after": "2026-01-01T00:00:00", "before": "2026-01-31T23:59:59" }

// Orders for specific customer
{ "customer": 42 }
```

## Order Notes

Two types of notes via `wc_create_order_note`:

- **Customer-visible** (`customer_note: true`): Sent to customer by email; use for shipping updates and tracking numbers.
- **Internal** (`customer_note: false`): Only visible in WP admin; use for staff notes and pick/pack instructions.

## Refund Process

1. Get order details: `wc_get_order` — verify items, amounts, payment method
2. Confirm with user: total to refund, which line items, whether to restock
3. Create refund: `wc_create_refund` with `amount`, `reason`, and optionally `line_items` for partial refunds
4. Verify: status transitions to `refunded` (full) or stays `processing` (partial)

Partial refund example:
```json
{
  "amount": "15.00",
  "reason": "Damaged item — partial refund",
  "restock_items": true
}
```

## Tips and Gotchas

- **Restock on cancel**: WooCommerce automatically restocks items when an order is cancelled if stock management is enabled.
- **Payment gateway refunds**: `wc_create_refund` triggers automatic refund via the payment gateway only if the gateway supports it (Stripe does, PayPal Standard does not).
- **Cannot un-complete**: Moving from `completed` back to `processing` is not a standard WooCommerce transition — avoid this.
- **Bulk status updates**: Iterate over order IDs with `wc_update_order_status`; there is no bulk endpoint in `wc/v3`.
- **Note emails**: Customer-visible notes trigger an email notification to the customer — use sparingly and with care.
