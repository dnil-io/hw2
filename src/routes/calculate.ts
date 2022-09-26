import {FastifyReply, FastifyRequest} from "fastify";
import {getRoutes, getStops, getStoptimes, getTrips} from "gtfs";

import * as createGraph from "ngraph.graph";
// @ts-ignore
import * as toDot from "ngraph.todot";
import {Graph} from "ngraph.graph";

let graph: Graph;

const setup = async () => {
    graph = createGraph.default()
    const routes = (await getRoutes());

    for (let route of routes) {
        if(!route.route_short_name?.startsWith("U")) continue;
        const trip = (await getTrips({route_id: route.route_id})).at(0);
        if(trip === undefined) continue;
        let stopTimes = (await getStoptimes({trip_id: trip.trip_id}));

        stopTimes = stopTimes.sort((a: any, b: any) => {return (a.stop_sequence as number) - (b.stop_sequence as number)});

        let last: any;

        stopTimes.forEach(c => {
            graph.addNode(trip.trip_id +"|"+c.stop_id);
            if(last !== undefined) {
                graph.addLink(trip.trip_id + "|"+last.stop_id, trip.trip_id + "|"+c.stop_id);
            }
            last = c;
        });
    }



}

const calculate = async (req: FastifyRequest, res: FastifyReply) => {
    await setup();
    return toDot.default(graph);
};

export { calculate };
