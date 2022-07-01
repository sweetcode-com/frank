# frank

Get web ranks for the websites in a Freemius account


## Requirements

- node 
- Freemius account
- [Similarweb](https://www.similarweb.com/) account (create an API key in the settings)

## Installation 

1. `cd` into the folder where you want to install the repo
2. `git clone https://github.com/sweetcode-com/frank.git`
3. `npm i`
4. Create a .env file (copy the .env.example file) and fill in all settings


If the repo was updated after your first install use `git pull` to get the current version.

## How to use

`node frank.js`

The app will output a csv file under the `output` folder. It will contain all domains and ranks for which Similarweb provided a rank.

Don't expect ranks for all domains. In my tests Similarweb only had ranks for approximately 20% of the domains for my plugin. 

## Info

By default the app will only filter for installs that are marked active (the plugin is in active use). You can change this in the code if you want to query other types: `all` , `active` , `inactive` , `trial` , `paying` , `uninstalled` , `active_premium` , `active_free`

With thousands of domains, retrieving all ranks can be slow. Similar web has a 10 requests per second rate limit.

The monthly free API limit is at 5'000 calls per month: https://support.similarweb.com/hc/en-us/articles/4414317910929-Website-DigitalRank-API 
If the website is not yet ranked by Similarweb, the API call doesn't count against the monthly API limit. 

The app will read the existing file and only update domains that are not in the file yet. 
If you want to re-run all domains, simply delete the file and run the app. 

## Troubleshooting 

Make sure to update node `npm update -g npm`