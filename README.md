# Intro
This repository contains the Typescript code used to control the WLKata robot arms (https://www.wlkata.com) used in the Schuberg Philis demo setup.

The arms are controlled over the serial bus using the g codes (https://document.wlkata.com/?doc=/wlkata-mirobot-user-manual-platinum/18-g-code-instruction-set/)

Each hardware item has a related class abstracting away implementation.

## Requirements
Node 18
NPM

## Getting started
Install the dependencies using NPM: `npm install`

Configure the correct ports or network connections for the boxes in `src/main.ts` and run `npm run start` to kick start the application.

## Software architecture
The repository contains a couple of constructs that help structure things.

#### Hardware
This folders contains all the code abstractions for the hardware. Each "real world" item will have an class that abstracts away implementation.

#### Helpers
Contains helpers functions/classes that can support other pieces of code.

#### Sequences
This is were most of the logic recides, see sequences as a combination of commands to achieve a particular goal.

#### Main.ts
This is the entry point of the application it sets up the connections to the boxes, and orchestrates between sequences etc.


## Prompt
Sometimes you might want to send raw commands for debugging purposes to the arms.
When the arms are connected over the network, you can't use WLKata studio for this.
The prompt script in the root can be used in this case to run a commandline tool that allows you to send raw commands straight to the arm. `npm run prompt`.
