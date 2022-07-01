import 'dotenv/config'
import { get_installs } from './modules/freemius.js'
import * as fs from 'fs'
import { EOL } from 'os'
import { get_rank_for_url, get_sw_remaining_api_requests } from './modules/similarweb.js'
import { parse } from 'csv-parse'

let fileStream
const fsCount = 50
let fsOffset = 0
const outputFolder = "output"
const outputFile = "ranks.csv"

const get_web_ranks_for_all_installs = async (existingDomains = []) => {

    while (true) {

        console.log("offset: " + fsOffset)

        let result = await get_installs(fsCount, fsOffset)

        if (!result.ok) break;

        let data = await result.json()

        fsOffset = fsOffset + fsCount

        if (data.installs.length === 0) break;

        for (const install of data.installs) {

            let domain = install.url.replace(/https?:\/\//, "")

            if (existingDomains.includes(domain)) continue

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
                return
            } else if (rank_data.error_code === 404) {
                fileStream.write(domain + "," + "no rank" + EOL)
            } else {
                // console.log(rank_data)
                fileStream.write(domain + "," + rank_data.rank + EOL)
            }
        }

        // break
    }
}

async function run(existingDomains = []) {

    if (await get_sw_remaining_api_requests() > 0) {
        get_web_ranks_for_all_installs(existingDomains)
    } else {
        console.log("monthly SimilarWeb API limit reached")
    }
}

fs.mkdir(outputFolder, { recursive: true }, (err) => {
    if (err) throw err
});

if (fs.existsSync(outputFolder + '/' + outputFile)) {

    let parser = parse({ delimiter: ',' });

    let existingDomains = []

    fs.createReadStream(outputFolder + '/' + outputFile)
        .pipe(parser)
        .on('data', (r) => {
            existingDomains.push(r[0])
        })
        .on('end', () => {
            fileStream = fs.createWriteStream(outputFolder + '/' + outputFile, { flags: 'a' });
            run(existingDomains)
        })
} else {
    fileStream = fs.createWriteStream(outputFolder + '/' + outputFile, { flags: 'a' });
    fileStream.write("domain, rank" + EOL)
    run()
}
