import { getRoutes, getStops, getTransfers, getTrips } from "gtfs";
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

const alphabet = ["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"];


function groupBy(xs, key) {
    return xs.reduce(function(rv, x) {
      (rv[x[key]] = rv[x[key]] || []).push(x);
      return rv;
    }, {});
}

export async function buildBetterGraph() {
    const stops = await getStops();
    const routes = await getRoutes();
    
    for(let route of routes) {
        progress++;

        if(!isRelevant(route)) continue;
        const trips = await getTrips({route_id: route.route_id});
        for (let trip of trips) {
            if(!isRelevantR()) continue;
            const { nodes, links } = await parseTrip(trip, graph);
            addAllNodes(nodes, graph);
            addAllLinks(links, graph);
        }
        console.error(progress + "/" + routes.length); 
    }
    console.log("stops");
    //add and connect stops with trips
    await graph.query(`MATCH (n) WHERE n.type='tp#arr' MERGE (x:stop {time: n.time, stop_id: n.stop_id, type: 'stop'}) MERGE (n)-[r:t {weight: 0}]->(x)`);
    await graph.query(`MATCH (n) WHERE n.type='tp#dep' MERGE (x:stop {time: n.time, stop_id: n.stop_id, type: 'stop'}) MERGE (x)-[r:t {weight: 0}]->(n)`);

    console.log("transfers");
    const transfers: any = await getTransfers();
    const grouped = groupBy(transfers, "from_stop_id");
    for (let transfer in grouped) {
        let list = grouped[transfer];
        var query = `MATCH (n) WHERE n.type='stop' AND NOT n.generated = true AND n.stop_id='${transfer}' `;
        let index = 0;
        for(let t of list) {
            if(transfer === t.to_stop_id) continue;
            let parsed = Number.parseInt(t.min_transfer_time);
            let duration = Math.ceil((parsed ? parsed : 0)/60) * 60;
            query += `MERGE (${alphabet[index]}:stop {time: n.time + ${duration}, stop_id: '${t.to_stop_id}', type: 'stop'}) ON CREATE SET ${alphabet[index]}.generated = true CREATE (n)-[r${alphabet[index]}:t {weight: ${duration}, type: 'transfer'}]->(${alphabet[index]}) `;
            index++;
        }
        await graph.query(query);
    }

    console.log(graph.query(`GRAPH.QUERY graph "MATCH (n) WHERE n.type='stop' RETURN n.stop_id, n.time AS time ORDER BY n.time"`));

    //MISSING: add transfers check
    //MISSING: connect stops 
    //MISSING: add meeting spots

}

