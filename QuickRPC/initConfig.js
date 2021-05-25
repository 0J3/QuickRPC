'use strict';

module.exports = async flag => {
	const { app } = require('electron');
	const Fs = require('fs-extra');
	const Path = require('path');
	const Axios = require('axios');

	const prefix = 'https://0j3.github.io/QuickRPC/Config/';
	const pathPrefix = Path.join(app.getPath('userData'), 'Config') + '/';

	Fs.ensureDirSync(pathPrefix);

	async function downloadFile(ufile) {
		const path = Path.resolve(pathPrefix, ufile);
		const writer = Fs.createWriteStream(path);
		const url = `${prefix}${ufile}`;
		console.log(path, '->', url);

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

	if (flag == 'onlyMainConfig') {
		await downloadFile('Config.json');
		return;
	} else if (flag == 'onlyGames') {
		const Games = (
			require(Path.resolve(app.getPath('userData'), 'Config/Config.json'))
				.GamesFolder || 'Games'
		).replace(pathPrefix, '');
		Fs.ensureDirSync(Games);
		await downloadFile(Games + '/GenshinImpact.json');
		await downloadFile(Games + '/Minecraft Launcher.json');
		await downloadFile(Games + '/Minecraft.json');
		await downloadFile(Games + '/OBS.json');
		await downloadFile(Games + '/Roblox.json');
		await downloadFile(Games + '/Streamlabs.json');
	}
};
