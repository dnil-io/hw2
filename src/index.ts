import {openDb, SqlDatabase} from "gtfs";
import { buildBetterGraph } from "./graph3/build/graph.js";

const gtfs = await openDb({sqlitePath: "./sqlitedb.sqlite"});

if(process.env.BUILD === "true") {
    await buildBetterGraph();

    console.error("created");

} else {
}
