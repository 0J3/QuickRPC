module.exports = async () => {
	const path = require('path');
	const fs = require('fs');

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
		url: 'https://0j3.github.io/QuickRPC/Config/Games/_index.json', //your url
		method: 'GET',
		responseType: 'blob', // important
	}).then(response => {
		const url = window.URL.createObjectURL(new Blob([response.data]));
		const link = document.createElement('a');
		link.href = url;
		link.setAttribute('download', 'file.pdf'); //or any other extension
		document.body.appendChild(link);
		link.click();
	});
};
