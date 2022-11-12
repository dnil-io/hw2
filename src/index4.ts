import {openDb, SqlDatabase} from "gtfs";
import { buildBetterGraph } from "./graph2/build/graph.js";
import { formatGraph } from "./graph2/format/view.js";
import * as todot from "ngraph.todot";
import * as fromdot from "ngraph.fromdot";
import * as tobinary from "ngraph.tobinary";
import * as frombinary from "ngraph.frombinary";
import * as fs from "fs";
import { createGtfsGraph } from "./utils/graph.js";
import { findMeetingSpots, printMeetingSpots } from "./graph2/algorithm/meet.js";
import createGraph from "ngraph.graph";

const gtfs = await openDb({sqlitePath: "./sqlitedb.sqlite"});
let graph;
if(process.env.BUILD === "true") {
    graph = await buildBetterGraph();

    console.error("created");

    formatGraph(graph);

    console.error("formatted");


    //console.log(todot.default(graph))
    tobinary.default(graph);
} else {
    console.log("reading");
    //const content = fs.readFileSync('test.dot', 'utf8');
    console.log("parsing");
    graph = frombinary.default(createGraph());
    console.error("loaded graph");
    for(let i = 0; i<50; i++) {
        const results: Set<string>[] = [];
        for(const start of ["de:11000:900162001:1:50", "de:11000:900110011:2:53"]) {
            results.push(findMeetingSpots(graph, start, 10*60*60, i*60));            
        }
        const intersectionR = intersection(...results);
        await printMeetingSpots(graph, intersectionR);
        if(intersectionR.size > 4) break;
        console.log("..................")
    }
}

function intersection(...sets: Set<any>[]) {
    const result = new Set();

    for (const elem of sets[0]) {
        let found = true;
        for(const set of sets) {
            if(!set.has(elem)) found = false;
        }
        if (found) {
            result.add(elem);
        }
    }
    console.log(sets[0]);
    console.log(sets[1]);
    return result;
}
