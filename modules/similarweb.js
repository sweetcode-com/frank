/**
 * https://support.similarweb.com/hc/en-us/articles/4414317910929-Website-DigitalRank-API
 * 
 * Error codes:
 * 
 * 400: Limit out of range. The field limit must be between 1 and 5000.
 * 401: This is a premium Similarweb endpoint. Please get in touch with a sales representative to learn more.
 * 403: The limit of monthly data points has been reached. Contact a sales representative to discuss our premium plans.
 * 404: Data not found. This site may not yet have a global rank.
 * 429: Too many requests made in a short period of time. This can happen if you make more than 10 requests per second.
 */

import { fetch_retry } from '../helpers.js'

//https://www.npmjs.com/package/limiter
import { RateLimiter } from 'limiter'


const limiter = new RateLimiter({ tokensPerInterval: 6, interval: "second" });

const get_rank_for_url = async (domain) => {

    let requestOptions = {
        method: 'GET',
        redirect: 'follow'
    };

    const remainingRequests = await limiter.removeTokens(1);

    let response = await fetch_retry(`https://api.similarweb.com/v1/similar-rank/${domain}/rank?api_key=${process.env.SW_API_KEY}`, requestOptions, 3)

    // console.log(response)

    // console.log(response.status)

    // if(!response.ok){
    //     console.log(response)
    //     return {
    //         status: "Some error",
    //         error_code: 401,
    //     }
    // }

    if (response.status === 403) {
        return {
            status: "The limit of monthly data points has been reached",
            error_code: 403,
        }
    }

    // console.log("response.status: " + response.status)

    if (response.status === 404) {
        return {
            status: "Data not found. This site may not yet have a global rank",
            error_code: 404,
        }
    }

    const response_data = await response.json()

    if (response_data.meta.error_code === 400) {
        return {
            status: "Limit out of range. The field limit must be between 1 and 5000",
            error_code: response_data.meta.error_code,
        }
    }

    if (response_data.meta.error_code === 403) {
        return {
            status: "The limit of monthly data points has been reached",
            error_code: response_data.meta.error_code,
        }
    }

    if (response_data.meta.error_code === 429) {
        return {
            status: "Too many requests made in a short period of time",
            error_code: response_data.meta.error_code,
        }
    }

    return {
        status: "Rank found",
        rank: response_data.similar_rank.rank,
        error_code: response_data.meta.error_code,
    }
}

const get_sw_remaining_api_requests = async () => {

    let requestOptions = {
        method: 'GET',
        redirect: 'follow'
    };

    let response = await fetch_retry(`https://api.similarweb.com/user-capabilities?api_key=${process.env.SW_API_KEY}`, requestOptions, 3)

    if (!response.ok) return false

    const response_data = await response.json()

    return response_data.user_remaining
}

export {
    get_rank_for_url,
    get_sw_remaining_api_requests,
}