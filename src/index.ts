import {openDb, SqlDatabase} from "gtfs";
import {fastify} from "fastify";
import {st} from "./routes/stops.js";
import {routeDefault} from "./routes/defaultRoute.js";
import {calculate} from "./routes/calculate.js";

let gtfs: SqlDatabase;

const fast = fastify({logger: true})

fast.get("/", routeDefault);
fast.get("/stops", st);
fast.get("/calculate", calculate);
fast.get("/query/hafas.exe", st);

try {
    gtfs = await openDb({sqlitePath: "./sqlitedb.sqlite"});

    await fast.listen({port: 3000})
} catch (err) {
    fast.log.error(err)
    process.exit(1)
}
