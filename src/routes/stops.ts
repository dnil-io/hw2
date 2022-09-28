import {FastifyReply, FastifyRequest} from "fastify";
import {getStops} from "gtfs";


const stops = async (req: FastifyRequest, res: FastifyReply) => {
    const stops = (await getStops(undefined, ["stop_id", "stop_name", "stop_lon", "stop_lat"], undefined, undefined));
    let n: Record<string, any>[] = [];

    stops.forEach(x => {
        if (!n.some((y: any) => y.stop_name == x.stop_name))
            n.push(x);
    });

    return n;
};

export { stops as st };
