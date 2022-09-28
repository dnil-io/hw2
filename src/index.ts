import {openDb, SqlDatabase} from "gtfs";
import {fastify} from "fastify";
import {st} from "./routes/stops.js";
import {routeDefault} from "./routes/defaultRoute.js";
import {calculate, calculateDebug} from "./routes/calculate.js";

let gtfs: SqlDatabase;

const fast = fastify({logger: true})

fast.get("/", routeDefault);
fast.get("/stops", st);
fast.get("/calculate/:from/:to", calculate);
fast.get("/debug/graph", calculateDebug);

try {
    gtfs = await openDb({sqlitePath: "./sqlitedb.sqlite"});

    await fast.listen({ port: 3001, host: "0.0.0.0"});
} catch (err) {
    fast.log.error(err)
    process.exit(1)
}
