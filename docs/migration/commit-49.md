# Commit 49 — Homepage Index / Featured Works + Products System

## Purpose

Adds a homepage index system that renders `works`, `products`, `tools`, and `lab` sections from page frontmatter instead of duplicating card data manually.

## Features

- `home-section` directive
- `HomeSection.vue`
- `ProductCard.vue`
- Product price/status display
- Featured/order/category filtering
- Product catalog listing on `/products`

## Rules

- Home sections read existing page metadata.
- Product prices are public when `product.priceVisible` is not false.
- `draft` and `hidden` products are excluded.
- `coming-soon` and `sold-out` products can be shown with `showUnavailable: true`.
