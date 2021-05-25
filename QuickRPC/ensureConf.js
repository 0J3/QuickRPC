const { app } = require('electron');
module.exports = async () => {
	const fs = require('fs-extra'),
		path = require('path');

	const initConf = require('./initConfig');
	if (
		!fs.existsSync(path.resolve(app.getPath('userData'), 'Config/Config.json'))
	) {
		fs.ensureDirSync(path.resolve(app.getPath('userData'), 'Config'));
		await initConf('onlyMainConfig');
	}
	let confjson = fs.readFileSync(
		path.resolve(app.getPath('userData'), 'Config/Config.json')
	);
	confjson = JSON.parse(confjson);

	const gamesFolder = path.resolve(
		app.getPath('userData'),
		'Config',
		confjson.GamesFolder || 'Games'
	);
	const quotesFile = path.resolve(
		app.getPath('userData'),
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
	return { confjson, gamesFolder, quotesFile };
};
