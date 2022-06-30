import 'dotenv/config'
import { get_installs } from './modules/freemius.js'
import * as fs from 'fs'
import { EOL } from 'os'
import { get_rank_for_url, get_sw_remaining_api_requests } from './modules/similarweb.js'
import { parse } from 'csv-parse'

var stream

const get_web_ranks_for_all_installs = async (arr = []) => {

    let count = 50
    let offset = 0

    while (true) {

        console.log("offset: " + offset)

        let result = await get_installs(count, offset)

        if (!result.ok) break;

        let data = await result.json()

        offset = offset + count

        if (data.installs.length === 0) break;

        for (const install of data.installs) {

            let domain = install.url.replace(/https?:\/\//, "")

            if (arr.includes(domain)) continue

            // console.log("domain: " + domain)

            let rank_data

            for (let i = 0; i < 5; i++) {

                rank_data = await get_rank_for_url(domain)

                if (rank_data.error_code !== 429) {
                    break
                }

                // wait one second before retrying
                await new Promise(res => setTimeout(res, 1000))
            }

            // console.log(rank_data)

            if (rank_data.error_code === 401) {
                console.log("Some error")
                // return
            } else if (rank_data.error_code === 403) {
                console.log("The limit of monthly data points has been reached")
                // return
            } else if (rank_data.error_code === 404) {
                stream.write(domain + "," + "no rank" + EOL)
            } else {
                // console.log(rank_data)
                stream.write(domain + "," + rank_data.rank + EOL)
            }
        }

        // break
    }
}

if (fs.existsSync('output' + '/ranks.csv')) {

    let parser = parse({ delimiter: ',' });

    let arr = []

    fs.createReadStream('output' + '/ranks.csv')
        .pipe(parser)
        .on('data', (r) => {
            arr.push(r[0])
        })
        .on('end', () => {
            stream = fs.createWriteStream("output/ranks.csv", { flags: 'a' });
            run(arr)
        })
}
else {
    stream = fs.createWriteStream("output/ranks.csv", { flags: 'a' });
    stream.write("domain, rank" + EOL)
    run()
}


fs.mkdir('output', { recursive: true }, (err) => {
    if (err) throw err
});


async function run(arr = []) {

    if (await get_sw_remaining_api_requests() > 0) {
        get_web_ranks_for_all_installs(arr)
    } else {
        console.log("monthly SimilarWeb API limit reached")
        get_web_ranks_for_all_installs(arr)
    }
}


