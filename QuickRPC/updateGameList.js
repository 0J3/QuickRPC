module.exports = async (gamesDir, overwriteGameJsonStrings) => {
	const path = require('path');
	const fs = require('fs');
	const axios = require('axios');
	const { downloadFile } = require('./util');

	const { data } = await axios({
		url: 'https://0j3.github.io/QuickRPC/Config/gameList.json',
		method: 'GET',
		responseType: 'json',
	});
	const { list } = data;
	list.forEach(item => {
		const file = path.resolve(gamesDir, item);
		if (fs.existsSync(file)) {
			if (overwriteGameJsonStrings == 'false' || !overwriteGameJsonStrings) {
				console.log(
					'Not overwriting',
					file,
					' '.repeat(Math.max(25 - item.length, 1)),
					'Reason: Flag overwriteGameJsonStrings is false or has no value'
				);
				return;
			}
		}
		downloadFile(data.root + item, file);
	});
};
