const defaultFlags = ['overwriteGameJsonStrings true'];

let util;
const init = async () => {
	const { confjson, gamesFolder, quotesFile, confDir } =
			await require('./ensureConf')(),
		fs = require('fs-extra'),
		path = require('path'),
		axios = require('axios');

	const dumpdir = path.resolve(confDir, 'Dump');

	if (fs.existsSync(path.resolve(dumpdir, 'app.log')))
		fs.appendFileSync(
			path.resolve(dumpdir, 'app.log'),
			`-- App Start @ ${new Date()}\n`
		);

	// if (!fs.existsSync(path.resolve(dumpdir, 'README.md')))

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

	const dump = (file, data, extendFile) => {
		if (isFlag('noDump')) return dump;
		if (
			file != 'README.md' &&
			!file.endsWith('.json') &&
			isFlag('onlyDumpJson')
		) {
		}
		if (file.endsWith('.log')) {
			extendFile = true;
			if (!(isFlag('noDumpToCentralLog') || file == 'app.log'))
				dump('app.log', `(${file}) ${data.split('\n').join(`(${file}) `)}`);
			if (!file == 'app.log') {
				const time = new Date().toString();
				data = time + ' | ' + data.split('\n').join(time + ' | ');
			}
		}
		if (typeof data == typeof {}) {
			data = JSON.stringify(data, ' ', 2);
		} else {
			data = data.toString();
		}
		const dumpPath = path.resolve(dumpdir, file);
		fs.ensureDirSync(dumpdir);
		if (!extendFile) fs.writeFileSync(dumpPath, data);
		else fs.appendFileSync(dumpPath, data + '\n');
		// console.log(`Dumped data to ${dumpPath}`);
		return dump;
	};

	console.log('a');
	dump(
		'README.md',
		'# Dump Data\n' +
			'This folder contains dump data, created for debugging purposes. <br/>\n' +
			'Deleting files here does not change program functionality in any way. <br/>\n' +
			'Editing files here also does nothing in terms of functionality, but edits will be replaced automatically when new content gets "dumped". <br/>\n' +
			'If you want all debug data, add `--allDump` on its own line in `.flags` <br/>\nHere are a few more flags for you to experiment with (remember to prefix these with `--`): <br/>\n' +
			'- `allDebug` (not only for dumping)\n' +
			'- `activityDump`\n' +
			'- `varDump`\n' +
			'- `gameDump`\n' +
			'- `onlyDumpJson` (removes all non-json logs)\n'
	);

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
		const util = await init();

		if (util.isFlag('logUtilInit', 'logUtil', 'allDump')) {
			util.dump(
				'utilLog.log',
				'Util not already initialized, initializing and caching'
			);
		}

		return util;
	} else {
		if (util.isFlag('logUtilInit', 'logUtil', 'allDump')) {
			util.dump(
				'utilLog.log',
				'Util already initialized, returning cached version'
			);
		}

		return util;
	}
};
