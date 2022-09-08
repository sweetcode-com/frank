/**
 * https://github.com/Freemius/freemius-node-sdk
 * 
 * https://freemius.docs.apiary.io/#reference/installs-/-a.k.a.-sites
 * 
 */

import 'dotenv/config'
import { fetch_retry } from '../helpers.js';
const { createHmac } = await import('node:crypto');

const freemiusEndpoint = "https://api.freemius.com"

function getInstallsUri(pluginId) {

    return "/v1/developers/" + process.env.FS_API_DEVELOPER_ID + "/plugins/" + pluginId + "/installs.json"
}

const authorizedRequestObject = (requestURI) => {

    const date = (new Date(Date.now())).toUTCString()

    const stringToSign =
        "GET" + "\n" +
        "" + "\n" +
        "application/json" + "\n" +
        date + "\n" +
        requestURI

    const uft8encodedStringToSign = Buffer.from(stringToSign, "utf-8").toString()

    const hmac = createHmac('sha256', process.env.FS_API_DEVELOPER_SECRET_KEY).update(uft8encodedStringToSign).digest('hex')

    let signature = Buffer.from(hmac).toString('base64')

    // We need to strip off the = from the end of the encoded string,
    // otherwise authentication will fail.
    signature = signature.replace(/=$/g, "")

    const authorizationObject = "FS" + " " + process.env.FS_API_DEVELOPER_ID + ":" + process.env.FS_API_DEVELOPER_PUBLIC_KEY + ":" + signature

    const requestObject = {
        method: 'GET',
        headers: {
            'Date': date,
            'Authorization': authorizationObject,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        }
    }

    return requestObject
}



/**
 * https://freemius.docs.apiary.io/#reference/installs-/-a.k.a.-sites
 * 
 * filter: all , active , inactive , trial , paying , uninstalled , active_premium , active_free
 */
const get_installs = async (pluginId, count = 50, offset = 0, filter = "active") => {
    return await fetch_retry(freemiusEndpoint + getInstallsUri(pluginId) + `?fields=url&filter=${filter}&count=${count}&offset=${offset}`, authorizedRequestObject(getInstallsUri(pluginId)), 10)
}

export {
    get_installs,
}