# QuickRPC

(Forked from [https://github.com/discordjs/RPC](https://github.com/discordjs/RPC) - All `var`/`function` keywords are to blame on that)<br/>

## Installation

### Dependencies

These instructions assume you have the following:

1. Discord (https://discord.com/)
2. NodeJS (https://nodejs.org/)
3. Yarnpkg (https://yarnpkg.com/) (Classic will do (`npm i -g yarn`))
4. Git (look it up)

Steps 2., 3. and 4. are only for [building from source](#build-instructions)

Once you have the following, you can proceed to [Installing QuickRPC from prebuilt installers](#installing-from-prebuilt-installers)

### Installing from Prebuilt Installers

To install QuickRPC from prebuilt installers, first, visit the [Releases Page](https://github.com/0j3/QuickRPC/releases/latest) page, download the appropriate file (`QuickRPC Setup <VERSION>.exe` for Windows, `quickrpc_<VERSION>_amd64.deb` for Debian-based Systems, `quickrpc_<VERSION>_amd64.snap` for other Linux Distributions, where `<VERSION>` is the latest version of QuickRPC)

#### Windows

Run `QuickRPC Setup <VERSION>.exe`

If Windows SmartScreen complains, click `Read More` (or similar), then `Run Anyway`

The only reason it's complaining is because i didn't sign my code with a code-signing license.

#### Linux: Snap

idk how to install snap files offhand just look it up ig

#### Linux: Deb

Open a Terminal, `cd` into the directory (usually `cd ~/Downloads`), and run `sudo apt install quickrpc_<VERSION>_amd64.deb`

## Build Instructions

### Downloading the shit

1. Clone the repository (you know how; `git clone https://github.com/0J3/QuickRPC.git`)
2. CD into the Directory: `cd QuickRPC`
3. Install packages `yarn`

### Running the shit

`yarn start`

### Building the shit

`yarn dist`
