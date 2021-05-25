module.exports = async () => {
	const path = require('path');
	const fs = require('fs');
	const axios = require('axios');

	async function downloadFile(url, file) {
		const writer = fs.createWriteStream(path.resolve(file));
		console.log(p, '->', url);

		const response = await Axios({
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

	axios({
		url: 'https://0j3.github.io/QuickRPC/Config/gameList.json',
		method: 'GET',
		responseType: 'json',
	}).then(response => {
		console.log(response.body);
	});
};
module.exports();
