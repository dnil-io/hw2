import { getRoutes, getStops, getStoptimes, getTrips } from "gtfs";
import createGraph, { Graph, Node } from "ngraph.graph";
import { addAllLinks, addAllNodes } from "../../utils/graphutils.js";
import { isRelevant, isRelevantR } from "./route.js";
import { connectStops, parseStops } from "./stop.js";
import { parseTrip } from "./trip.js";

var progress = 0;
var length;

export async function buildBetterGraph(): Promise<Graph> {
    const graph = createGraph();
    const stops = await getStops();
    const routes = await getRoutes();
    
    length = routes.length;

    for(let route of routes) {
        progress++;
        if(!isRelevant(route)) continue;
        const trips = await getTrips({route_id: route.route_id});
        for (let trip of trips) {
            if(!isRelevantR()) continue;
            var { nodes, links} = await parseTrip(trip);
            addAllNodes(nodes, graph);
            addAllLinks(links, graph);
        }
        console.error(progress + "/" + length); 
    }

    await connectStops(graph);


    return graph;
}
