'use strict';

/* eslint-disable no-console */
(async () => {
	const { confjson, gamesFolder, quotesFile } = await require('./ensureConf')(),
		path = require('path'),
		fs = require('fs-extra'),
		getpid = require('getpid');

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

		fs.writeFileSync('games-readonly.json', JSON.stringify(games));

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
		mainWindow.setAlwaysOnTop(true);
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
			largeImageText: 'Status',
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
	}

	rpc.on('ready', () => {
		setActivity();

		setInterval(() => {
			setActivity();
		}, 15e3);
	});

	rpc.login({ clientId }).catch(console.error);
})();
