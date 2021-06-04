'use strict';

/* eslint-disable no-console */

const loadRPC = confjson => {
	const DiscordRPC = require('../src');

	// Set this to your Client ID.
	const clientId = confjson.ClientID;

	// Only needed if you want to use spectate, join, or ask to join
	DiscordRPC.register(clientId);

	const rpc = new DiscordRPC.Client({ transport: 'ipc' });

	return rpc;
};

(async () => {
	console.log('app start');
	const path = require('path'),
		fs = require('fs-extra'),
		getpid = require('getpid'),
		electron = require('electron'),
		packageJson = require('../package.json');

	const { app, BrowserWindow, dialog, shell } = electron,
		{
			confjson,
			gamesFolder,
			quotesFile,
			confDir,
			isFlag,
			ensureFlagExists,
			getFlagValue,
			dump,
		} = await require('./util')();

	ensureFlagExists('overwriteGameJsonStrings', 'true');

	const clientId = confjson.ClientID;
	const rpc = loadRPC(confjson);

	if (isFlag('noDump'))
		console.warn('All dumps are disabled. This is strongly discouraged!');

	const checkIfProcessIsRunning = name => {
		if (typeof name == typeof []) {
			return new Promise(async res => {
				let v = false;
				for (let i = 0; i < name.length; i++) {
					const x = name[i];
					if (await checkIfProcessIsRunning(x)) v = true;
				}
				return res(v);
			});
		} else
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

		if (isFlag('allDump', 'gameDump', 'allDebug')) dump('games.json', games);

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
		// quote = quote.split('%GUILDCOUNT%').join(rpc.getGuilds());

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

		if (isFlag('allDump', 'varDump', 'allDebug'))
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

	const url = require('url');

	let mainWindow;

	const axios = require('axios');

	const { data } = await axios({
		url: 'https://api.github.com/repos/0J3/QuickRPC/git/refs/tags',
		method: 'GET',
		responseType: 'json',
	});

	if (
		data[data.length - 1].ref != 'refs/tags/' + packageJson.version &&
		!isFlag('noUpdateCheck')
	) {
		console.log('UPDATE NEEDED');
		shell.openExternal('https://github.com/0J3/QuickRPC/releases/latest/');
		dialog.showErrorBox(
			'Update Required',
			'QuickRPC requires an update! Please download the latest installer from https://github.com/0J3/QuickRPC/releases/latest/'
		);
		return process.exit(1);
	}

	const createWindow = async () => {
		// Update Checker

		mainWindow = new BrowserWindow({
			minWidth: 320,
			width: 380,
			minHeight: 230,
			height: 260,
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

	app.on('window-all-closed', () => {
		app.quit();
	});

	app.whenReady().then(() => {
		createWindow();

		app.on('activate', () => {
			// On macOS it's common to re-create a window in the app when the
			// dock icon is clicked and there are no other windows open.
			if (BrowserWindow.getAllWindows().length === 0) createWindow();
		});
	});

	const startTimestamp = new Date();

	let lastAct = {};

	const setActivity = async () => {
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

		if (isFlag('allDump', 'activityDump', 'allDebug'))
			dump('activity.json', act);

		if (isFlag('allDump', 'userDump', 'rpcUserDump', 'allDebug'))
			dump('user.json', rpc.user);

		if (isFlag('allDump', 'rpcOptionsDump', 'allDebug'))
			dump('options.json', rpc.options);

		if (isFlag('KRUGS4ZANFZSAYJAOJUWG23SN5WGYIDCOV2CAYTFOR2GK4Q='))
			dump(
				'NFWXA4TPOZUXGZLEEBZXAYLHNBSXI5DJ.url',
				`[{000214A0-0000-0000-C000-000000000046}]
Prop3=19,11
[InternetShortcut]
IDList=
URL=https://media.nora.lgbt/hri/
`
			);

		mainWindow.webContents.executeJavaScript(
			`document.getElementById('User').innerText="${rpc.user.username}"`
		);
		mainWindow.webContents.executeJavaScript(
			`document.getElementById('ID').innerText="${rpc.user.id}"`
		);
	};

	rpc.on('ready', () => {
		console.log('Ready');
		setActivity();

		setInterval(() => {
			setActivity();
		}, 15e3);

		let i = 0;

		let interval;
		interval = setInterval(() => {
			const CONFIGFOLDER = confDir.split('\\').join('\\\\\\\\');
			mainWindow.webContents.executeJavaScript(
				`document.getElementById('openConf').href="JavaScript:require('child_process').exec(\\"${
					process.platform == 'win32'
						? `explorer \\\\\\"${CONFIGFOLDER}\\\\\\"`
						: process.platform != 'darwin'
						? `xdg-open \\\\\\"${CONFIGFOLDER}\\\\\\"`
						: ''
				}\\",()=>{})"`
			);
			i++;
			if (i > 15) {
				clearInterval(interval);
			}
		}, 1e3);

		if (!isFlag('noUpdateGameList'))
			require('./updateGameList')(
				gamesFolder,
				getFlagValue('overwriteGameJsonStrings').toString()
			).then(() => {
				console.log('Updated Game List!');
			});
	});

	try {
		await rpc.login({ clientId });
	} catch (e) {
		dump('rpcError.log', e);
		console.error(e);
		dialog.showErrorBox(
			'QuickRPC RPC Connection Error',
			'An error has occured while connecting to RPC.\nDetails:' +
				e +
				'\nRun QuickRPC in CMD to get more info'
		);
		process.exit(1);
	}
})();
