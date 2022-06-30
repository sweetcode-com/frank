import 'dotenv/config'
import { get_installs } from './freemius.js'
import * as fs from 'fs'
import { EOL } from 'os'


const get_rank_for_url = async (domain) => {

    let requestOptions = {
        method: 'GET',
        redirect: 'follow'
    };

    let response = await fetch(`https://api.similarweb.com/v1/similar-rank/${domain}/rank?api_key=${process.env.SW_API_KEY}`, requestOptions)

    if(!response.ok) return false

    const response_data = await response.json()

    if (response_data.meta.error_code === 401) {
        return false
    } else {
        // console.log("rank: " + response_data.similar_rank.rank)
        return response_data.similar_rank.rank
    }
}

const get_web_ranks_for_all_installs = async () => {

    let count = 50
    let offset = 0

    var stream = fs.createWriteStream("output/ranks.csv", { flags: 'a' });

    while (true) {

        console.log("offset: " + offset )

        let result = await get_installs(count, offset)

        if (!result.ok) break;

        let data = await result.json()

        offset = offset + count

        if (data.installs.length === 0) break;

        for (const install of data.installs) {

            let domain = install.url.replace(/https?:\/\//, "")

            let rank = await get_rank_for_url(domain)

            if (rank) {
                console.log("Rank for domain " + domain + ": " + rank)
                stream.write(domain + "," + rank + EOL)
            } else {
                // console.log("No rank for domain " + domain)
            }
        }

        // break;
    }
}

fs.mkdir('output', { recursive: true }, (err) => {
    if (err) throw err;
});

get_web_ranks_for_all_installs()
