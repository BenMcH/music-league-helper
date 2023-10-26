import {load} from 'cheerio'

if (process.argv.length !== 3) {
	console.log("You must only provide a url such as:\n\n\tnode index.mjs https://open.spotify.com/playlist/4nvBOC29dinyAtdGMWD32D");
	process.exit(0)
}

const file = await fetch(process.argv[2], {
	headers: {
		accept: 'application/html'
	}
}).then(resp => resp.text());

const $ = load(file);

const songs = $('meta[name=music:song]').toArray()
const urls = songs.map(song => $(song).attr('content'))

const getInfo = async (url) => {
	const resp = await fetch(url).then(r => r.text());

	const $ = load(resp);

	const title = $('meta[property=og:title]').attr('content')
	const artist = $('meta[property=og:description]').attr('content').split(' · ')[0]

	return {
		artist,
		title
	}
}

const data = await Promise.all(urls.map(url => getInfo(url)))

const output = '* ' + data.map(info => `${info.title} - ${info.artist}`).join('\n* ')

console.log(output);
