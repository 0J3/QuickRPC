'use strict';

module.exports = async () => {
	const Fs = require('fs-extra');
	const Path = require('path');
	const Axios = require('axios');

	const prefix = 'https://0j3.github.io/QuickRPC/Config/';
	const pathPrefix = 'Config/';

	async function downloadFile(ufile) {
		const path = Path.resolve(pathPrefix + ufile);
		const writer = Fs.createWriteStream(path);

		const response = await Axios({
			url: `${prefix}${ufile}`,
			method: 'GET',
			responseType: 'stream',
		});

		response.data.pipe(writer);

		return new Promise((resolve, reject) => {
			writer.on('finish', resolve);
			writer.on('error', reject);
		});
	}

	const Games = (
		require('../Config/Config.json').GamesFolder || 'Games'
	).replace(pathPrefix, '');

	await downloadFile(Games + '/GenshinImpact.json');
	await downloadFile(Games + '/Minecraft Launcher.json');
	await downloadFile(Games + '/Minecraft.json');
	await downloadFile(Games + '/OBS.json');
	await downloadFile(Games + '/Roblox.json');
	await downloadFile(Games + '/Streamlabs.json');
};
