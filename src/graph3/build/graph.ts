import { getRoutes, getStops, getTransfers, getTrips } from "gtfs";
import { createClient, Graph } from 'redis';
import { isRelevant, isRelevantR } from "../../graph2/build/route.js";
import { parseTrip } from "../../graph2/build/trip.js";

const client = createClient();

client.on('error', (err) => console.log('Redis Client Error', err));

await client.connect();

await client.set('key', 'value');

//client.DEL("graph");

const graph = new Graph(client, 'graph');


var progress = 0;

export async function buildBetterGraph() {
    const stops = await getStops();
    const routes = await getRoutes();
    /*
    await graph.query(`CREATE INDEX FOR (p:TpA) ON (p.trip_id, p.sequence)`);
    await graph.query(`CREATE INDEX FOR (p:TpD) ON (p.trip_id, p.sequence)`);
    for(let route of routes) {
        progress++;

        if(!isRelevant(route)) continue;
        const trips = await getTrips({route_id: route.route_id});
        for (let trip of trips) {
            //if(!isRelevantR()) continue;
            await parseTrip(trip, graph);
        }
        console.error(progress + "/" + routes.length); 
    }
    console.log("stops")
    //add and connect stops with trips
    await graph.query(`CREATE INDEX FOR (p:Stop) ON (p.stop_id)`);
    await graph.query(`CREATE INDEX FOR (p:Stop) ON (p.generated, p.stop_id)`);
    await graph.query(`CREATE INDEX FOR (p:Stop) ON (p.time, p.stop_id)`);

    await graph.query(`MATCH (n:TpA) MERGE (x:Stop {time: n.time, stop_id: n.stop_id}) MERGE (n)-[r:c {weight: 0}]->(x)`);
    await graph.query(`MATCH (n:TpD) MERGE (x:Stop {time: n.time, stop_id: n.stop_id}) MERGE (x)-[r:c {weight: 0}]->(n)`);

    console.log("transfers");
    const transfers = await getTransfers();
    for (let transfer of transfers) {
        if(transfer.from_stop_id === transfer.to_stop_id) continue;
        let parsed = Number.parseInt(transfer.min_transfer_time);
        let duration = Math.ceil((parsed ? parsed : 0)/60) * 60;
        await graph.query(`MATCH (n:Stop) WHERE NOT n.generated = true AND n.stop_id='${transfer.from_stop_id}' MERGE (x:Stop {time: n.time + ${duration}, stop_id: '${transfer.to_stop_id}'}) ON CREATE SET x.generated = true MERGE (n)-[r:transfer {weight: ${duration}}]->(x)`);
    }
*/
    const data = (await graph.query(`MATCH (n:Stop) RETURN n.stop_id AS name, n.time AS time ORDER BY n.time`)).data as any[];
    if(!data) return;
    console.log("connecting stops");
    const lastTime = {};
    for(const stop of data) {
        if(lastTime[stop.name]) {
           // await connectStop(stop.name, lastTime[stop.name], stop.time);
        }
        lastTime[stop.name] = stop.time;
    } 
    console.log("Add meeting spots");
    for(const stopName in lastTime) {
        console.log(stopName);
        await graph.query(`MATCH (n:Stop) WHERE n.stop_id = '${stopName}' MERGE (x:Meet {name:'${stopName}' }) CREATE (n)-[r:end]->(x)`);
    }
}

async function connectStop(name: string, timeA: number, timeB: number) {
    await graph.query(`MATCH (n:Stop), (x:Stop) WHERE n.stop_id = '${name}' AND n.time = ${timeA} AND x.stop_id = '${name}' AND x.time = ${timeB} CREATE (n)-[r:t {weight: ${timeB-timeA}}]->(x)`);
}