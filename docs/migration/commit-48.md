# Commit 48 — Store-ready Content Model / Product Catalog Foundation

## Purpose

Adds a products category and product frontmatter/CSV model for future store/catalog expansion.

## Store contract

- Checkout links use Toss Payments through `product.checkoutUrl`.
- Digital downloads are reserved for Cloudflare through `product.downloadUrl`.
- Product prices are public by default with `product.priceVisible: true`.
- `coming-soon` and `sold-out` products may remain visible when `product.showWhenUnavailable: true`.

## Non-scope

No cart, order storage, payment processing, stock decrement, or customer account logic is implemented in this commit.
