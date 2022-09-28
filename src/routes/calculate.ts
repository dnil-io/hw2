import {FastifyReply, FastifyRequest} from "fastify";
import {getRoutes, getStops, getStoptimes, getTransfers, getTrips} from "gtfs";

import createGraph from "ngraph.graph";
import * as toGexf from "ngraph.gexf";
import {Graph} from "ngraph.graph";
import * as ngraphPath from "ngraph.path";

let graph: Graph;

const setup = async () => {
    if(graph !== undefined) {
        graph = createGraph({ multigraph: false });
        const routes = (await getRoutes());
        const stops = (await getStops(undefined, ["stop_id", "stop_name", "stop_lon", "stop_lat"], undefined, undefined));

        for (let route of routes) {
            if(!route.route_short_name?.startsWith("U") && !route.route_short_name?.startsWith("S")) continue;
            const trip = (await getTrips({route_id: route.route_id})).at(0);
            if(trip === undefined) continue;
            let stopTimes = (await getStoptimes({trip_id: trip.trip_id}));

            stopTimes = stopTimes.sort((a: any, b: any) => {return (a.stop_sequence as number) - (b.stop_sequence as number)});

            let last: any;

            stopTimes.forEach(c => {
                let stop = stops.find(x => x.stop_id == c.stop_id);

                graph.addNode(trip.trip_id +"|"+c.stop_id, {name: route.route_short_name, stop_id: c.stop_id, label: stop?.stop_name, lat: parseFloat(stop?.stop_lat), lng: parseFloat(stop?.stop_lon)});


                if(last !== undefined) {
                    //weight:
                    let timeA = new Date (last.arrival_time);
                    let timeB = new Date (c.arrival_time);
                    let duration = 1;
                    duration = timeB.getMilliseconds()-timeA.getMilliseconds(); // 11:14 11:16
                    duration = duration / 60000; //convert to minutes

                    graph.addLink(trip.trip_id + "|"+last.stop_id, trip.trip_id + "|"+c.stop_id, {weight: duration});
                }
                last = c;
            });
        }


        //add transfers
        const transfers = (await getTransfers());

        graph.forEachNode(node => {
            let nodeStop = node.data.stop_id;
            for(let transfer of transfers) {
                if(transfer.from_stop_id === nodeStop) {
                    graph.forEachNode(node_b => {
                        if(node_b.data.stop_id === transfer.to_stop_id && node.id !== node_b.id) {
                            graph.addLink(node.id, node_b.id, {desc: "TRANSFER"});
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
    const {from, to}  = (req.params as any);
    
    const graph = await setup();

    const pathFinder = ngraphPath.aStar(graph, {
        distance(fromNode, toNode, link) {
            return link.data.weight;
        }
    });

    let fromNode, toNode;
    
    graph.forEachNode(node => {
        if(node.data.stop_id == from) fromNode = node}
        );


    const path = pathFinder.find(from, to);
    

    /*let pathFinder = aStar(graph, {
        // We tell our pathfinder what should it use as a distance function:
        distance(fromNode, toNode, link) {
          // We don't really care about from/to nodes in this case,
          // as link.data has all needed information:
          return link.data.weight;
        }
      });
      let path = pathFinder.find('a', 'd');*/

    return ;
};

export { calculate , calculateDebug };
