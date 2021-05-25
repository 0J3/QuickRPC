module.exports = async gamesDir => {
	const path = require('path');
	const fs = require('fs');
	const axios = require('axios');

	async function downloadFile(url, file) {
		const writer = fs.createWriteStream(path.resolve(file));
		console.log(file, '->', url);

		const response = await axios({
			url,
			method: 'GET',
			responseType: 'stream',
		});

		response.data.pipe(writer);

		return new Promise((resolve, reject) => {
			writer.on('finish', resolve);
			writer.on('error', reject);
		});
	}

	const { data } = await axios({
		url: 'https://0j3.github.io/QuickRPC/Config/gameList.json',
		method: 'GET',
		responseType: 'json',
	});
	const { list } = data;
	list.forEach(item => {
		downloadFile(data.root + item, path.resolve(gamesDir, item));
	});
};
