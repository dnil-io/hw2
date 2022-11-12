import { getTransfers } from "gtfs";


export async function connectTransfers() {
    const transfers = await getTransfers();

    for(let transfer of transfers) {
        
    }
    //todo child stops
}