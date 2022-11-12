import { getRoutes, getStops, getTrips } from "gtfs";
import { createClient, Graph } from 'redis';
import { isRelevant, isRelevantR } from "../../graph2/build/route.js";
import { parseTrip } from "../../graph2/build/trip.js";
import { addAllLinks, addAllNodes } from "../../utils/graphutils.js";

const client = createClient();

client.on('error', (err) => console.log('Redis Client Error', err));

await client.connect();

await client.set('key', 'value');

client.DEL("graph");

const graph = new Graph(client, 'graph');


var progress = 0;

export async function buildBetterGraph() {
    const stops = await getStops();
    const routes = await getRoutes();
    
    await graph.query('CREATE (n:test2)', {});
    await graph.query('CREATE (n:test2)', {});

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

        console.error(progress + "/" + routes.length); 
    }
}