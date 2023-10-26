import { load } from 'cheerio'
import yt from '@googleapis/youtube';

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

const API_KEY = process.env.YT_API_KEY

const youtube = yt.youtube("v3")

async function searchSongs(query) {
	const response = await youtube.search.list({
		auth: API_KEY,
		part: 'snippet',
		type: 'video',
		q: query,
	});

	const items = response.data.items;

	if (items) {
		// it is assumed that the first uploaded video is correct. 
		const sortedItems = items.sort((a, b) => a.snippet.publishedAt.localeCompare(b.snippet.publishedAt))

		return sortedItems[0].id.videoId;
	} else {
		console.log('No search results found.');
		return null;
	}
}

const videoIds = await Promise.all(data.map(d => searchSongs(`${d.title} - ${d.artist}`)))
const links = videoIds.map(v => `https://www.youtube.com/watch?v=${v}`)

const output = data.map((data, index) => `${data.title} - ${data.artist}: ${links[index]}`)

console.log('* ' + output.join('\n* '));
