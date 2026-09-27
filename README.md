# CBBD API

This is the repository for the CBBD API, currently hosted at [api.CollegeBasketballData.com](https://api.collegebasketballdata.com). The API is built on NodeJS using TypeScript and Express over a PostgreSQL database.

This project is an offshoot of CollegeFootballData.com. You can retrieve an API key at the CollegeBasketballData.com website that will work with both the CFBD and CBBD APIs.

## Getting Started

This repo uses `pnpm` for dependency management. Run the following commands to install dependencies and start a dev server with hot reloading:

```bash
pnpm install
pnpm dev
```

Documentation commands use the generated TSOA OpenAPI document as their source:

```bash
pnpm docs:build    # generate OpenAPI and build the Zudoku site
pnpm docs:dev      # generate OpenAPI and start the Zudoku dev server
```

The deployed [Zudoku documentation](https://api.collegebasketballdata.com/) is
served by the API application. The generated OpenAPI document remains available
at `/api-docs.json`, and the previous Swagger UI remains available at
`/swagger` during the transition.

### Website service principals

**Release phase: temporary compatibility deployment.** The marked
`TEMPORARY CUTOVER` block in `src/config/auth.ts` still accepts the existing
website Origin for eligible public GETs without credentials. Paid operations,
other methods, and requests carrying credentials cannot use that branch.
This is not completed remediation. After deploying the migrated website, remove
that block, its `legacy_website` log outcome, and the temporary HTTP test; replace
the test with strict public-route Origin denial coverage. There is no runtime
switch for enabling the bypass.

The final implementation requires bearer authentication for data in all
modes; Origin/Host headers never authenticate. Production requires four disjoint
positive safe integer IDs: `CBBD_PUBLIC_PAGE_SERVICE_USER_ID`,
`CBBD_EXPORTER_SERVICE_USER_ID`, `CFBD_PUBLIC_PAGE_SERVICE_USER_ID`, and
`CFBD_EXPORTER_SERVICE_USER_ID`. Both CFB users are rejected before metrics or
quota. CBB services must be unrestricted, non-admin, Tier 0 users. Pages have an
exact five-operation scope and no monthly debit; exporter GET scope excludes
scoreboard and leaderboard and has its own normal atomic allowance.

Tier guards attach to generated handlers, including alternate URL spellings.
Direct API admins still need Tier 1 for scoreboard and Tier 2 for leaderboard.
Only the scoped page service has the explicit leaderboard exception. Enrollment
and documentation remain public. The existing quota wrapper retains synchronous
Express sends and refunds failed reservations exactly once.

`REDIS_URL` / `REDIS_PASSWORD` reuse the existing CFB connection. CBB snapshot and
lock keys use `cbb-api:v1:scoreboard:*`; successful canonical snapshots live for
60 seconds, with authorized DB fallback on cache failures.

Production rollout is in progress. Follow the adjacent web repository's
[CBB cutover runbook](../web/docs/runbooks/cbb-api-access-cutover.md). Do not deploy
strict auth before the migrated website and proxy gates. Foreign containment
must remain permanently in both APIs; never remove it during this migration.

### Code Formatting

This repo uses `prettier` and `eslint` for code formatting. Run the following command to format your code before committing:

```bash
pnpm prettify
```

### Semantic Versioning

Semantic versioning is used for this project. Version numbers are automatically updated via [semantic-release](https://github.com/semantic-release/semantic-release) based on commit messages. [commitlint](https://commitlint.js.org/) is used to enforce commit message formatting.

## Project Architecture

### tsoa and Express

This project uses [tsoa](https://tsoa-community.github.io/docs/) to generate OpenAPI documentation and Express routes from TypeScript controllers.

### Data Access

Data access is implemented using [kysely](https://kysely.dev/), a lightweight SQL query builder for TypeScript.

### Folder Structure

```
src/
├── app/ - application logic
│   └── category/ - application category
│       ├── controller.ts - tsoa controller
│       ├── service.ts - business logic
│       └── types.ts - typescript types
├── config/
│   ├── middleware/ - tsoa and express middlewares
│   ├── types/ - typescript types
│   ├── auth.ts - authorization logic
│   ├── database.ts - database configuration
│   ├── errors.ts - error handling
│   └── express.ts - express configuration
├── globals/ - global types and constants
└── app.ts - application entrypoint
```
