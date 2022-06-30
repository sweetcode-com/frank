# fs-rank

Get web ranks for the websites in a Freemius account


## Requirements

- node 
- Freemius account
- SimilarWeb account (create an API key in the settings)

## Installation 

1. Change to the folder where you want to install the repo
2. `git clone https://github.com/sweetcode-com/fs-rank.git`
3. `npm i`
4. Create a .env file (copy the .env.example file) and fill in all settings

## How to use

`node app.js`

The app will output a csv file under the `output` folder. It will contain all domains and ranks for which SimilarWeb provided a rank.

## Info

By default the app will only filter for installs that are marked active (the plugin is in active use). You can change this in the code if you want to query other types: all , active , inactive , trial , paying , uninstalled , active_premium , active_free

If you want to change the output folder or file name, you can change this in the code too. 

With thousands of domains, retrieving all ranks can be slow. I didn't parallelize the retrieval from SimilarWeb, which could have been much faster, because I didn't want the app to run into a rate limit by SimilarWeb.

