import {FastifyReply, FastifyRequest} from "fastify";

export const routeDefault = async (request: FastifyRequest, reply: FastifyReply) => {
    return "haha no.";
};
