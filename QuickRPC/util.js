let util;
const init = async () => {
	const defaultFlags = ['overwriteGameJsonStrings true'];

	const { confjson, gamesFolder, quotesFile, confDir } =
			await require('./ensureConf')(),
		fs = require('fs-extra'),
		path = require('path');

	const ensureFlagFile = () => {
		if (!fs.existsSync(path.resolve(confDir, '.flags'))) {
			fs.ensureFileSync(path.resolve(confDir, '.flags'));
			fs.writeFileSync(
				path.resolve(confDir, '.flags'),
				'--' + defaultFlags.join('\n--')
			);
			return false;
		}
		fs.ensureFileSync(path.resolve(confDir, '.flags')); // ensure anyway just incase
		return true;
	};

	const getFlagValue = flag => {
		ensureFlagFile();
		const flagsFile = fs
			.readFileSync(path.resolve(confDir, '.flags'))
			.toString();

		const s = flagsFile.split('\n');

		for (const k in s) {
			if (Object.hasOwnProperty.call(s, k)) {
				const e = s[k].split(' ');

				if (e.shift() == '--' + flag) {
					return e.join(' ');
				}
			}
		}
	};

	// console.log(getFlagValue('a'));

	// if has value, this will return false
	const isFlag = (...flags) => {
		ensureFlagFile();
		const flagsFile = fs
			.readFileSync(path.resolve(confDir, '.flags'))
			.toString();

		const checkFlag = f => flagsFile.split('\n').includes('--' + f);

		for (let index = 0; index < flags.length; index++) {
			const e = flags[index];
			if (checkFlag(e)) return true;
		}
		return false;
	};

	const ensureFlagExists = (flag, defaultValue) => {
		if (!(isFlag(flag) || getFlagValue(flag))) {
			fs.appendFileSync(
				path.resolve(confDir, '.flags'),
				'\n--' + flag + ' ' + defaultValue
			);
		}
	};

	const dump = (file, data) => {
		if (isFlag('noDump')) return dump;
		if (typeof data == typeof {}) {
			data = JSON.stringify(data, ' ', 2);
		} else {
			data = data.toString();
		}
		const dumpdir = path.resolve(confDir, 'Dump');
		const dumpPath = path.resolve(dumpdir, file);
		fs.ensureDirSync(dumpdir);
		fs.writeFileSync(dumpPath, data);
		// console.log(`Dumped data to ${dumpPath}`);
		if (!fs.existsSync(path.resolve(dumpdir, 'README.md'))) {
			fs.writeFileSync(
				path.resolve(dumpdir, 'README.md'),
				'# Dump Data\nThis folder contains dump data, created for debugging purposes.\nDeleting files here does not' +
					' change program functionality in any way. <br/>\n' +
					'Editing files here also does nothing in terms of functionality, but edits will be replaced automatically when new content gets "dumped".'
			);
		}
		return dump;
	};

	const downloadFile = async (url, file) => {
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
	};

	util = {
		confjson,
		gamesFolder,
		quotesFile,
		confDir,
		isFlag,
		ensureFlagExists,
		getFlagValue,
		dump,
		downloadFile,
	};
	return util;
};

module.exports = async () => {
	if (!util) {
		return await init();
	} else {
		console.log(util);

		return util;
	}
};
