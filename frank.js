import 'dotenv/config'
import { get_installs } from './modules/freemius.js'
import * as fs from 'fs'
import * as fsp from 'node:fs/promises'
import os from 'os'
import { get_rank_for_url, get_sw_remaining_api_requests } from './modules/similarweb.js'
// import { parse } from 'csv-parse'
import * as util from 'util'
import * as stream from 'stream'
import { parse } from 'csv-parse/sync'
import { RateLimiter } from "limiter"

let fileStream
const fsCount = 50
const outputFolder = "output"
const outputFile = "ranks.csv"
const pipeline = util.promisify(stream.pipeline)

// https://docs.api.similarweb.com/
const similarwebLimiter = new RateLimiter({ tokensPerInterval: 4, interval: "second" });
// const freemiusLimiter = new RateLimiter({ tokensPerInterval: 10, interval: "second" });


const get_web_ranks_for_all_installs = async (pluginId, existingDomains = []) => {

    let fsOffset = 0

    while (true) {

        console.log("offset: " + fsOffset)

        let result = await get_installs(pluginId, fsCount, fsOffset)

        if (!result.ok) break;

        let data = await result.json()

        fsOffset = fsOffset + fsCount

        if (data.installs.length === 0) break;

        for (const install of data.installs) {

            let domain = install.url

            domain = domain.replace(/https?:\/\//, "")
            domain = domain.replace(/\/.*/, "")

            // console.log("domain: " + domain)

            if (existingDomains.includes(domain)) continue


            rank(domain)
        }

        // break
    }
}

async function rank(domain) {

    let rank_data

    // for (let i = 0; i < 5; i++) {

    //     await similarwebLimiter.removeTokens(1);

    //     console.log("getting rank for: " + domain)
    //     rank_data = await get_rank_for_url(domain)

    //     if (rank_data.error_code !== 429) {
    //         break
    //     }

    //     // wait one second before retrying
    //     await new Promise(res => setTimeout(res, 1000))
    // }

    await similarwebLimiter.removeTokens(1);

    console.log("getting rank for: " + domain)
    rank_data = await get_rank_for_url(domain)

    // console.log(rank_data)

    if (rank_data.error_code === 401) {
        console.log("Some error")
        // return
    } else if (rank_data.error_code === 403) {
        console.log("The limit of monthly data points has been reached")
        return
    } else if (rank_data.error_code === 404) {
        fileStream.write(domain + "," + "no rank")
        fileStream.write(os.EOL)

    } else {
        fileStream.write(domain + "," + rank_data.rank)
        fileStream.write(os.EOL)
    }

}

async function run(pluginId, existingDomains = []) {

    if (await get_sw_remaining_api_requests() > 0) {
        await get_web_ranks_for_all_installs(pluginId, existingDomains)
    } else {
        console.log("monthly SimilarWeb API limit reached")
    }
}

fs.mkdir(outputFolder, { recursive: true }, (err) => {
    if (err) throw err
});

for (const pluginId of process.env.FS_API_PLUGIN_ID.split(',')) {

    console.log('plugin ID: ' + pluginId)

    if (fs.existsSync(outputFolder + '/' + outputFile)) {

        // parse the csv file
        // const csv = fs.readFileSync(outputFolder + '/' + outputFile, 'utf8')
        const csv = fs.readFileSync(outputFolder + '/' + outputFile, { encoding: 'utf8', flag: 'r' })
        // let file = fs.readFileSync(outputFolder + '/' + outputFile, { encoding: 'utf8', flag: 'r' })


        // put the csv data into an array
        const csvData = parse(csv, {
            columns: true,
            skip_empty_lines: true
        })

        // const csvData = parse(csv, {
        //     delimiter: ',',
        //     skip_empty_lines: true,
        // })

        // console.log(csvData)

        // Only keep the domains
        const existingDomains = csvData.map((row) => {
            return row.domain
        })

        // console.log(existingDomains)

        fileStream = fs.createWriteStream(outputFolder + '/' + outputFile, { flags: 'a' })
        await run(pluginId, existingDomains)

    } else {
        fileStream = fs.createWriteStream(outputFolder + '/' + outputFile, { flags: 'a' });
        fileStream.write("domain,rank" + os.EOL)
        await run(pluginId)
    }
}
