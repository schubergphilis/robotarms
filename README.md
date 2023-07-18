# Intro
This repository contains the Typescript code used to control the WLKata robot arms (https://www.wlkata.com) used in the Schuberg Philis demo setup.

The arms are controlled over the serial bus using the g codes (https://document.wlkata.com/?doc=/wlkata-mirobot-user-manual-platinum/18-g-code-instruction-set/)

Each hardware item has a related class abstracting away implementation.

## Requirements
Node 18
NPM

## Getting started
Install the dependencies using NPM: `npm install`

Configure the correct ports for the connection boxes in `src/main.ts` and run `npm run start` to kick start the application.
