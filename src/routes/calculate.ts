import {FastifyReply, FastifyRequest} from "fastify";
import {getRoutes, getStops, getStoptimes, getTransfers, getTrips} from "gtfs";

import createGraph from "ngraph.graph";
import * as toGexf from "ngraph.gexf";
import {Graph} from "ngraph.graph";
import * as ngraphPath from "ngraph.path";

let graph: Graph;

const setup = async () => {
    if (graph === undefined) {
        graph = createGraph({multigraph: false});
        const routes = (await getRoutes());
        const stops = (await getStops(undefined, ["stop_id", "stop_name", "stop_lon", "stop_lat"], undefined, undefined));

        for (let route of routes) {
            //if (!route.route_short_name?.startsWith("U") && !route.route_short_name?.startsWith("S")) continue;
            const tripId = await findMostCommonTrip(route.route_id);
            if (tripId === undefined) continue;
            let stopTimes = (await getStoptimes({trip_id: tripId}));

            stopTimes = stopTimes.sort((a: any, b: any) => {
                return (a.stop_sequence as number) - (b.stop_sequence as number)
            });

            let last: any;

            stopTimes.forEach(c => {
                let stop = stops.find(x => x.stop_id == c.stop_id);

                graph.addNode(tripId + "|" + c.stop_id, {
                    name: route.route_short_name,
                    stop_id: c.stop_id,
                    label: stop?.stop_name,
                    lat: parseFloat(stop?.stop_lat),
                    lng: parseFloat(stop?.stop_lon)
                });


                if (last !== undefined) {
                    //weight:
                    let timesA = last.arrival_time.split(":");
                    let timesB = c.arrival_time.split(":");

                    let timeA = new Date(1,1,1,timesA[0], timesA[1]);
                    let timeB = new Date(1,1,1,timesB[0],timesB[1]);
                    let duration = 1;
                    duration = timeB.getMilliseconds() - timeA.getMilliseconds(); // 11:14 11:16
                    duration = duration / 60000; //convert to minutes

                    graph.addLink(tripId + "|" + last.stop_id, tripId + "|" + c.stop_id, {weight: duration});
                }
                last = c;
            });
        }


        //add transfers
        const transfers = (await getTransfers());

        graph.forEachNode(node => {
            let nodeStop = node.data.stop_id;
            for (let transfer of transfers) {
                if (transfer.from_stop_id === nodeStop) {
                    graph.forEachNode(node_b => {
                        if (node_b.data.stop_id === transfer.to_stop_id && node.id !== node_b.id) {
                            graph.addLink(node.id, node_b.id, {weight: transfer.min_transfer_time});
                        }
                    });
                }
            }
        });
    }
    return graph;

}

const calculateDebug = async (req: FastifyRequest, res: FastifyReply) => {
    return toGexf.save(await setup());
};

const calculate = async (req: FastifyRequest, res: FastifyReply) => {
    const {from, to} = (req.params as any);

    const graph = await setup();

    const pathFinder = ngraphPath.aStar(graph, {
        distance(fromNode, toNode, link) {
            return link.data.weight;
        }
    });

    let fromNode, toNode;

    graph.forEachNode(node => {
            if (node.data.stop_id === from)
                fromNode = node;
            else if (node.data.stop_id === to)
                toNode = node;
        }
);


    const path = pathFinder.find(fromNode.id, toNode.id);

    return ;
};

export {calculate, calculateDebug};
