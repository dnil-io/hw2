import { getStoptimes } from "gtfs";
import { Graph } from "redis";
import { addWithLink } from "../../utils/graphutils.js";

export async function parseTrip(trip: any, graph: Graph) {
    var stoptimes = await getStoptimes({trip_id: trip.trip_id});

    stoptimes = stoptimes.sort((a: any, b: any) => {
        return (a.stop_sequence as number) - (b.stop_sequence as number)
    });
    
    var lastEdge;

    var nodes: any = [];
    var links: any = [];

    for (let stop of stoptimes) {
        var name = `${stop.trip_id}#${stop.stop_sequence}`;
        var edgeData = {
            stop_id: stop.stop_id,
            trip_id: trip.trip_id,
            sequence: stop.stop_sequence,
        };
        var arrival = {name: `tp#${name}#arrival`, data: {time: stop.arrival_timestamp, type: "tp#arr", ...edgeData}};
        var departure  = {name: `tp#${name}#departure`, data: {time: stop.departure_timestamp, type: "tp#dep", ...edgeData}};
        await addWithLink(arrival, departure, {weight: stop.departure_timestamp - stop.arrival_timestamp }, graph);
        if(lastEdge !== undefined) {
            links.push({from: lastEdge.name, to: arrival.name, data: {weight: arrival.data.time - lastEdge.data.time}});
        }
        lastEdge = departure;
    }

    return {nodes: nodes, links: links}
}