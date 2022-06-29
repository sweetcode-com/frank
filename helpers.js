import fetch from "node-fetch"

// https://dev.to/ycmjason/javascript-fetch-retry-upon-failure-3p6g
const fetch_retry = async (url, options, n) => {
    try {
        return await fetch(url, options)
    } catch (err) {
        if (n === 1) throw err;
        return await fetch_retry(url, options, n - 1);
    }
}

export { fetch_retry }