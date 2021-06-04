'use strict';

const builder = require('electron-builder');
const Platform = builder.Platform;
const fs = require('fs');
const path = require('path');

let certData = {};
if (
	fs.existsSync(path.resolve('./key')) &&
	fs.existsSync(path.resolve('./key/cert.pfx')) &&
	fs.existsSync(path.resolve('./key/passwd.txt'))
) {
	certData = {
		cscLink: path.resolve('./key/cert.pfx'),
		cscKeyPassword: fs
			.readFileSync(path.resolve('./key/passwd.txt'))
			.toString(),
	};
}

// Promise is returned
builder
	.build({
		targets: [
			Platform.WINDOWS.createTarget('nsis'),
			Platform.LINUX.createTarget(),
		],
		config: {
			appId: 'lgbt.nora.QuickRPC',
			productName: 'QuickRPC',
			copyright: 'Copyright © 2021 0J3.',
			files: [
				'**/*',
				'!**/node_modules/*/{CHANGELOG.md,README.md,README,readme.md,readme}',
				'!**/node_modules/*/{test,__tests__,tests,powered-test,example,examples}',
				'!**/node_modules/*.d.ts',
				'!**/node_modules/.bin',
				'!**/*.{iml,o,hprof,orig,pyc,pyo,rbc,swp,csproj,sln,xproj}',
				'!.editorconfig',
				'!**/._*',
				'!**/{.DS_Store,.git,.hg,.svn,CVS,RCS,SCCS,.gitignore,.gitattributes}',
				'!**/{__pycache__,thumbs.db,.flowconfig,.idea,.vs,.nyc_output}',
				'!**/{appveyor.yml,.travis.yml,circle.yml}',
				'!**/{npm-debug.log,yarn.lock,.yarn-integrity,.yarn-metadata.json}',
				'!**/key',
				'!**/key/*',
				'!**/key/*.pfx',
				'!**/key/cert.pfx',
				'!key/cert.pfx',
			],

			...certData,
		},
		win: {
			publisherName: '0J3',
			compression: 'maximum',
		},
		linux: {
			synopsis: 'A Discord RPC Client',
			description: 'A Discord Rich Presence Client',
			executableName: 'QuickRPC',
			category: 'Network',
			target: ['snap', 'deb', 'rpm', 'apk'],
			compression: 'maximum',
		},
		deb: {
			depends: [
				'gconf2',
				'gconf-service',
				'libnotify4',
				'libappindicator1',
				'libxtst6',
				'libnss3',
				'discord',
			],
			priority: 'standard',
		},
	})
	.then(v => {
		// handle result
		console.log(v);
	})
	.catch(error => {
		// handle error
		console.error(error);
	});
