import {openDb, SqlDatabase} from "gtfs";
import {fastify} from "fastify";
import {st} from "./routes/stops.js";
import {routeDefault} from "./routes/defaultRoute.js";
import {calculate, calculateDebug} from "./routes/calculate.js";
import { createGtfsGraph } from "./utils/graph.js";
import { buildBetterGraph } from "./utils/graph2.js";


let gtfs: SqlDatabase;

/*
const fast = fastify({logger: true})

fast.get("/", routeDefault);
fast.get("/stops", st);
fast.get("/calculate/:from/:to", calculate);
fast.get("/debug/graph", calculateDebug);

fast.addHook("preHandler", (req, res, done) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
    done();
});

try {
    console.log("loading gtfs file");
    gtfs = await openDb({sqlitePath: "./sqlitedb.sqlite"});

    console.log("creating graph...");
    await createGtfsGraph();
    await fast.listen({ port: 3001, host: "0.0.0.0" });
    console.log("started! c:");
} catch (err) {
    fast.log.error(err)
    process.exit(1)
}
*/

