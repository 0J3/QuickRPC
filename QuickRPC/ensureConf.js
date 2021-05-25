const { app } = require('electron');
const userData = app.getPath('userData');
module.exports = async () => {
	const fs = require('fs-extra'),
		path = require('path');

	const confDir = path.resolve(userData, 'Config');

	const initConf = require('./initConfig');
	if (!fs.existsSync(path.resolve(userData, 'Config/Config.json'))) {
		fs.ensureDirSync(confDir);
		await initConf('onlyMainConfig');
	}
	let confjson = fs.readFileSync(path.resolve(userData, 'Config/Config.json'));
	confjson = JSON.parse(confjson);

	const gamesFolder = path.resolve(
		userData,
		'Config',
		confjson.GamesFolder || 'Games'
	);
	const quotesFile = path.resolve(
		userData,
		'Config',
		confjson.QuotesFile || 'Quotes.txt'
	);
	if (!fs.existsSync(gamesFolder)) {
		fs.ensureDirSync(gamesFolder);

		await initConf('onlyGames');
	}
	fs.ensureFileSync(quotesFile);
	if (fs.readFileSync(quotesFile) == '') {
		fs.writeFileSync(
			quotesFile,
			'// Each quote is on one line - Empty lines and lines starting with `//` are ignored.\nHello there\n'
		);
	}
	return { confjson, gamesFolder, quotesFile, confDir };
};
