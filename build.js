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
		targets: Platform.WINDOWS.createTarget('nsis'),
		config: {
			appId: 'lgbt.nora.QuickRPC',
			productName: 'QuickRPC',
			copyright: 'Copyright © 2021 0J3.',

			...certData,
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
