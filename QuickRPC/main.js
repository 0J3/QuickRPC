'use strict';

/* eslint-disable no-console */

const defaultFlags = ['overwriteGameJsonStrings true'];

(async () => {
	console.log('app start');
	const { confjson, gamesFolder, quotesFile, confDir } =
			await require('./ensureConf')(),
		path = require('path'),
		fs = require('fs-extra'),
		getpid = require('getpid');

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

	ensureFlagExists('overwriteGameJsonStrings', 'true');

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

	if (isFlag('noDump'))
		console.warn('All dumps are disabled. This is strongly discouraged!');

	const checkIfProcessIsRunning = name => {
		return new Promise(res => {
			getpid(name, (err, pid) => {
				if (err) {
					return handle_error(err);
				}

				if (Array.isArray(pid)) {
					res(true);
				} else {
					// Even if no errors occurred, pid may still be null/undefined if it wasn't found
					if (pid) {
						res(true);
					} else {
						res(false);
					}
				}
			});
		});
	};

	const getGames = () => {
		const gamesJSONList = fs.readdirSync(gamesFolder);

		const gamesUnsorted = [];

		gamesJSONList.forEach(game => {
			try {
				game = JSON.parse(fs.readFileSync(gamesFolder + '/' + game).toString());
				if (game.Enabled) {
					const priority = game.Priority || 0;
					gamesUnsorted[priority] = gamesUnsorted[priority] || [];
					gamesUnsorted[priority][gamesUnsorted[priority].length] = game;
				}
			} catch (error) {
				console.error(`Error loading game ${game}:`, error);
			}
		});

		gamesUnsorted.reverse();

		const games = [];

		gamesUnsorted.forEach(gameList => {
			gameList.forEach(game => {
				games[games.length] = game;
			});
		});

		if (isFlag('debugDump', 'allDump', 'gameDump', 'allDebug'))
			dump('games.json', games);

		return games;
	};
	const getQuotes = () => {
		const rawQuotes = fs.readFileSync(quotesFile).toString();

		const quotes = [];

		rawQuotes.split('\n').forEach(quote => {
			if (
				!quote.startsWith('//') &&
				quote.trim() != '' &&
				quote.length <= 128
			) {
				quotes[quotes.length] = quote;
			}
		});

		return quotes;
	};

	const getRandomEntry = t => {
		return t[Math.floor(Math.random() * t.length) + 0];
	};

	let currentGameIcon = '';
	let currentGame = '';
	let currentGamePrefix = 'Playing';
	let quote = '';
	let smallText = '';

	const updateVars = async () => {
		const games = getGames();
		const quotes = getQuotes();

		quote = getRandomEntry(quotes);

		let game = {
			DisplayName: 'Nothing',
		};

		for (let index = 0; index < games.length; index++) {
			const g = games[index];

			const v = await checkIfProcessIsRunning(g.Exe);
			if (v) {
				game = g;
				break;
			}
		}

		currentGameIcon = game.Icon || 'Default_Small';
		currentGame = game.DisplayName || 'Unknown';
		currentGamePrefix = game.Prefix || 'Playing';
		smallText = `${currentGame || 'Unknown'} (Priority: ${game.Priority || 0})`;

		if (isFlag('debugDump', 'allDump', 'varDump', 'allDebug'))
			dump('vars.json', {
				exposedVars: {
					currentGameIcon,
					currentGame,
					currentGamePrefix,
					smallText,
					quote,
				},
				generatedFrom: {
					game,
				},
			});
	};

	const { app, BrowserWindow } = require('electron');
	const url = require('url');
	const DiscordRPC = require('../src');

	let mainWindow;

	const createWindow = () => {
		mainWindow = new BrowserWindow({
			minWidth: 320,
			width: 380,
			minHeight: 230,
			height: 250,
			// resizable: false,
			titleBarStyle: 'hidden',
			webPreferences: {
				nodeIntegration: true,
				worldSafeExecuteJavaScript: false,
				contextIsolation: false,
			},
		});

		mainWindow.loadURL(
			url.format({
				pathname: path.join(__dirname, 'index.html'),
				protocol: 'file:',
				slashes: true,
			})
		);

		mainWindow.on('closed', () => {
			mainWindow = null;
		});

		mainWindow.setMenuBarVisibility(false);
		mainWindow.setAlwaysOnTop(true, 'screen-saver'); // screen-saver to go ontop of fullscreen windows
		mainWindow.setOpacity(0.5);
	};

	app.whenReady().then(() => {
		createWindow();

		app.on('activate', () => {
			// On macOS it's common to re-create a window in the app when the
			// dock icon is clicked and there are no other windows open.
			if (BrowserWindow.getAllWindows().length === 0) createWindow();
		});
	});

	app.on('window-all-closed', () => {
		app.quit();
	});

	// Set this to your Client ID.
	const clientId = confjson.ClientID;

	let lastAct = {};

	// Only needed if you want to use spectate, join, or ask to join
	DiscordRPC.register(clientId);

	const rpc = new DiscordRPC.Client({ transport: 'ipc' });
	const startTimestamp = new Date();

	async function setActivity() {
		if (!rpc || !mainWindow) {
			return;
		}

		await updateVars();

		const act = {
			details: quote || 'Please Wait...',
			state: `${currentGamePrefix} ${currentGame || 'Unknown'}`,
			startTimestamp,
			largeImageKey: 'large_icon',
			largeImageText: '0J3 / QuickRPC',
			smallImageKey: currentGameIcon.toLowerCase(),
			smallImageText: smallText,
			instance: false,
			buttons: [confjson.Button1 || null, confjson.Button2 || null],
		};

		if (act == lastAct) return;

		lastAct = act;

		// You'll need to have snek_large and snek_small assets uploaded to
		// https://discord.com/developers/applications/<application_id>/rich-presence/assets
		rpc.setActivity(act);

		mainWindow.webContents.executeJavaScript(
			`document.getElementById('CurrentQuote').innerHTML=decodeURIComponent("${encodeURIComponent(
				quote
			)}")`
		);
		mainWindow.webContents.executeJavaScript(
			`document.getElementById('CurrentGame').innerHTML=decodeURIComponent("${encodeURIComponent(
				smallText
			)}")`
		);
		mainWindow.webContents.executeJavaScript(`
		document.getElementById('openConf').href="JavaScript:require('child_process').exec('explorer \\"${confDir
			.split('\\')
			.join('\\\\\\\\')}\\"',()=>{})"`);

		if (isFlag('debugDump', 'allDump', 'activityDump', 'allDebug'))
			dump('activity.json', act);
	}

	rpc.on('ready', () => {
		setActivity();

		setInterval(() => {
			setActivity();
		}, 15e3);

		if (!isFlag('noUpdateGameList'))
			require('./updateGameList')(
				gamesFolder,
				getFlagValue('overwriteGameJsonStrings').toString()
			).then(() => {
				console.log('Updated Game List!');
			});
	});

	rpc.login({ clientId }).catch(console.error);
})();
