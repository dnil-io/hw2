import { getStoptimes } from "gtfs";
import { Graph } from "redis";
import { addWithLink } from "../../utils/graphutils.js";
import JSON5 from 'json5'

export async function parseTrip(trip: any, graph: Graph) {
    var stoptimes = await getStoptimes({trip_id: trip.trip_id});

    stoptimes = stoptimes.sort((a: any, b: any) => {
        return (a.stop_sequence as number) - (b.stop_sequence as number)
    });
    
    var lastEdge;

    var nodes: any = [];
    var links: any = [];

    for (let stop of stoptimes) {
        var edgeData = {
            stop_id: stop.stop_id,
            trip_id: trip.trip_id,
            sequence: stop.stop_sequence,
        };
        var arrival = {name: `TpA`, data: {time: stop.arrival_timestamp, ...edgeData}};
        var departure  = {name: `TpD`, data: {time: stop.departure_timestamp, ...edgeData}};
        await addWithLink(arrival, departure, {weight: stop.departure_timestamp - stop.arrival_timestamp }, graph);
        if(lastEdge !== undefined) {
            graph.query(`MATCH (a:TpD), (b:TpA) WHERE a.trip_id = '${lastEdge.data.trip_id}' AND a.sequence = ${lastEdge.data.sequence} AND b.trip_id = '${arrival.data.trip_id}' AND b.sequence = ${arrival.data.sequence} CREATE (a)-[r:c ${JSON5.stringify({weight: arrival.data.time - lastEdge.data.time})}]->(b)`);
        }
        lastEdge = departure;
    }

    return {nodes: nodes, links: links}
}