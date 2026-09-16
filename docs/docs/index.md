---
sidebar_position: 0
slug: /
title: Start here
---

# Brezn Bude Tracking Docs 🥨

Every page in the sidebar is generated from a JSON Schema in `static/schemas/`.
Change the schema, and the page changes with it.

The schemas are also served as files, for example
[`/schemas/pretzel-add-to-cart-event.json`](pathname:///schemas/pretzel-add-to-cart-event.json).
That URL is what the shop's validator checks every `dataLayer.push` against.
