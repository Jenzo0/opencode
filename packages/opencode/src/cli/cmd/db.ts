import type { Argv } from "yargs"
import { spawn } from "child_process"
import { statSync } from "fs"
import { Database } from "@opencode-ai/core/database/database"
import { Effect } from "effect"
import { sql } from "drizzle-orm"
import { effectCmd } from "../effect-cmd"

const QueryCommand = effectCmd({
  command: "$0 [query]",
  describe: "open an interactive sqlite3 shell or run a query",
  instance: false,
  builder: (yargs: Argv) => {
    return yargs
      .positional("query", {
        type: "string",
        describe: "SQL query to execute",
      })
      .option("format", {
        type: "string",
        choices: ["json", "tsv"],
        default: "tsv",
        describe: "Output format",
      })
  },
  handler: Effect.fn("Cli.db.query")(function* (args: { query?: string; format: string }) {
    const query = args.query as string | undefined
    if (query) {
      const { db } = yield* Database.Service
      const result = yield* db.all<Record<string, unknown>>(sql.raw(query)).pipe(Effect.orDie)
      if (args.format === "json") console.log(JSON.stringify(result, null, 2))
      else if (result.length > 0) {
        const keys = Object.keys(result[0])
        console.log(keys.join("\t"))
        for (const row of result) console.log(keys.map((key) => row[key]).join("\t"))
      }
      return
    }
    const child = spawn("sqlite3", [Database.path()], {
      stdio: "inherit",
    })
    yield* Effect.promise(() => new Promise((resolve) => child.on("close", resolve)))
  }),
})

const sizeMB = (file: string) => {
  try {
    return statSync(file).size / 1048576
  } catch {
    return 0
  }
}

const PruneCommand = effectCmd({
  command: "prune",
  describe: "delete sessions older than N days and reclaim disk space",
  instance: false,
  builder: (yargs: Argv) => {
    return yargs
      .option("days", {
        type: "number",
        default: 90,
        describe: "delete sessions not updated in the last N days",
      })
      .option("dry-run", {
        type: "boolean",
        default: false,
        describe: "only report what would be deleted",
      })
  },
  handler: Effect.fn("Cli.db.prune")(function* (args: { days: number; "dry-run": boolean }) {
    const dryRun = args["dry-run"]
    const { db } = yield* Database.Service
    const file = Database.path()
    const before = sizeMB(file)
    const cutoff = Date.now() - Math.max(1, args.days) * 86400000
    // ponytail: messages/parts cascade from session via FK (foreign_keys=ON in Database.layer)
    const stale = yield* db
      .all<{ count: number }>(sql`SELECT COUNT(*) AS count FROM session WHERE time_updated < ${cutoff}`)
      .pipe(Effect.orDie)
    const count = stale[0]?.count ?? 0
    if (dryRun) {
      console.log(`${count} session(s) older than ${args.days} day(s) — db is ${before.toFixed(1)} MB (dry run, nothing deleted)`)
      return
    }
    if (count > 0) {
      yield* db.run(sql`DELETE FROM session WHERE time_updated < ${cutoff}`).pipe(Effect.orDie)
      yield* db.run(sql`VACUUM`).pipe(Effect.orDie)
    }
    const after = sizeMB(file)
    console.log(
      `deleted ${count} session(s) older than ${args.days} day(s) — ${before.toFixed(1)} MB → ${after.toFixed(1)} MB`,
    )
  }),
})

const PathCommand = effectCmd({
  command: "path",
  describe: "print the database path",
  instance: false,
  handler: Effect.fn("Cli.db.path")(function* () {
    console.log(Database.path())
  }),
})

export const DbCommand = effectCmd({
  command: "db",
  describe: "database tools",
  instance: false,
  builder: (yargs: Argv) => {
    return yargs.command(QueryCommand).command(PathCommand).command(PruneCommand).demandCommand()
  },
  handler: Effect.fn("Cli.db")(function* () {}),
})
