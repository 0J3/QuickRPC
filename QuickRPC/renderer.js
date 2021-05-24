// 'use strict';

/* eslint-env browser */

const { webFrame } = require('electron');

// const snek = document.getElementById('snek');

webFrame.setVisualZoomLevelLimits(1, 1);
webFrame.setLayoutZoomLevelLimits(0, 0);

// snek.onmousedown = () => {
// 	snek.style['font-size'] = '110%';
// 	update();
// };

// snek.onmouseup = () => {
// 	snek.style['font-size'] = '100%';
// };
