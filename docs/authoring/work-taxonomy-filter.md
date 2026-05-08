# Work Taxonomy Filter

## Purpose

The Works surface uses work taxonomy to help visitors browse projects by what the work is, what role it represents, what stack it uses, and which tags describe it.

This is a navigation layer, not a full content rewrite. Existing Markdown and editorial blocks remain valid.

## SSOT

```txt
src/types/workTaxonomy.ts
src/data/workTaxonomy.ts
src/utils/workFilters.ts
src/components/works/WorksSearchPanel.vue
src/components/portfolio/WorkFilterChip.vue
src/components/portfolio/WorkTaxonomyBadge.vue
```

## Taxonomy fields

```yaml
work:
  type: "system"
  category: "system"
  role:
    - "designer"
    - "developer"
  stack:
    - "typescript"
    - "vue"
  tags:
    - "portfolio"
    - "showroom"
```

## Category

Use category for the broad shape of the work.

```txt
design
tool
system
writing
commerce
experiment
```

## Role

Use role for what kind of authorship the work demonstrates.

```txt
designer
developer
system-architect
writer
editor
automation-planner
```

## Stack

Use stack for the technical or authoring tools that materially shaped the result.

```txt
typescript
vue
vite
cloudflare
webgpu
google-sheets
appsheet
markdown
notion
css
```

## Filter rule

A work is filterable only when it is public and active. Hidden, private, draft, noindex, dummy, playground, and QA preview pages must not leak into the filterable Works surface.

## Authoring rule

Do not turn taxonomy into a tag bin. Category, role, and stack should explain how to read the work. Tags can stay flexible and content-specific.
