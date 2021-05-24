module.exports = async () => {
	const fs = require('fs-extra'),
		path = require('path');
	const initConf = require('./initConfig');
	if (!fs.existsSync('../Config/Config.json')) {
		fs.ensureDirSync('Config');
		await initConf('onlyMainConfig');
	}
	let confjson = fs.readFileSync('Config/Config.json');
	confjson = JSON.parse(confjson);

	const gamesFolder = path.resolve(confjson.GamesFolder || 'Config/Games');
	const quotesFile = path.resolve(confjson.QuotesFile || 'Config/Quotes.txt');
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
