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
    getprocesses = require('getprocesses').default,
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
  ensureFlagExists('gameLineOverwrite', 'none');

  const clientId = confjson.ClientID;
  const rpc = loadRPC(confjson);

  if (isFlag('noDump'))
    console.warn('All dumps are disabled. This is strongly discouraged!');

  let processes = [];
  const updateProcesses = async () => {
    processes = await getprocesses();
  };

  const checkIfProcessIsRunning = name => {
    // ANCHOR Check Process Is Running
    if (getFlagValue('gameLineOverwrite') != 'none') return;
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
        name = name.toLowerCase();
        if (name.includes('.exe') && !name.includes('\\.exe')) {
          console.warn(
            '.exe (instead of \\.exe) might break regex! Be warned!'
          );
          console.info(
            "If there's no arguments specified in the exe value, there's no point in specifying .exe! We automatically check for both with .exe and without!"
          );
        }
        const reg = new RegExp(name);
        processes.forEach(element => {
          const cmd = element.command.toLowerCase();
          const raw = element.rawCommandLine.toLowerCase();

          const check = cmd => {
            return reg.test(cmd);
          };

          const matches = cmd => {
            return (
              check(cmd, name) ||
              check(cmd + '\\.exe', name) ||
              check(cmd, name + '\\.exe')
            );
          };

          if (matches(cmd) || matches(raw)) {
            res(true);
          }
        });
        res(false);
      });
  };

  const getGames = () => {
    // ANCHOR Get Games
    if (getFlagValue('gameLineOverwrite') != 'none') return [];

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

    if (getFlagValue('gameLineOverwrite') == 'none') {
      await updateProcesses();
      for (const i in games) {
        if (Object.hasOwnProperty.call(games, i)) {
          const g = games[i];

          const v = await checkIfProcessIsRunning(g.Exe);
          dump('gameCheck.json', {
            game: g,
            result: v,
            next: games[i + 1] || 'none',
          });
          if (v) {
            game = g;
            break;
          }
        }
      }
    } else
      game = {
        Exe: ['OVERWRITE'],
        Prefix: '',
        DisplayName: getFlagValue('gameLineOverwrite'),
        Enabled: true,
        Icon: 'overwrite',
        Priority: 1,
      };

    currentGameIcon = game.Icon || 'Default_Small';
    currentGame = game.DisplayName || 'Unknown';
    currentGamePrefix =
      typeof game.Prefix == typeof null ? 'Playing' : game.Prefix;
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

  // ANCHOR Update Check
  const { data } = await axios({
    url: 'https://github.com/0J3/QuickRPC/raw/main/VERSIONS.json',
    method: 'GET',
    responseType: 'json',
  });

  if (!data.includes(packageJson.version) && !isFlag('noUpdateCheck')) {
    console.log('UPDATE NEEDED');
    shell.openExternal('https://github.com/0J3/QuickRPC/releases/latest/');
    dialog.showErrorBox(
      'Update Required',
      'QuickRPC requires an update! Please download the latest installer from https://github.com/0J3/QuickRPC/releases/latest/'
    );
    return;
  }

  const createWindow = async () => {
    // ANCHOR Create Window
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
    // ANCHOR Set Activity
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

    // Set Activity: Update Window
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

    // Dump Data
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
      i++;
      if (i > 15 || !mainWindow) {
        clearInterval(interval);
        return;
      }
      const CONFIGFOLDER = confDir.split('\\').join('\\\\\\\\');
      mainWindow.webContents.executeJavaScript(
        `document.getElementById('openConf').href="JavaScript:require('child_process').exec(\\"${
          process.platform == 'win32'
            ? `explorer \\\\\\"${CONFIGFOLDER}\\\\\\"`
            : process.platform != 'darwin'
            ? `xdg-open \\\\\\"${CONFIGFOLDER}\\\\\\"`
            : ''
        }\\",()=>{})"
document.getElementById('VERSION').innerHTML='v${packageJson.version}'`
      );
    }, 1e3);

    // ANCHOR Update game list
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
