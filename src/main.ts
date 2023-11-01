import express, { Express } from 'express';
import expressWs from 'express-ws';
import { RawData } from 'ws';
import { join } from 'path';
import { fork, ChildProcess } from 'node:child_process';
import { v4 as uuid } from 'uuid';
import { logger } from './logger';

enum Status {
  RUNNING = 'Running',
  IDLE = 'Idle',
  FINISHED = 'Finished',
  ERROR = 'Error',
  STOPPED = 'Stopped'
}

interface ISocketMessage {
  action: string;
  data?: unknown;
}


const baseApp: Express = express();
const { app } = expressWs(baseApp)
baseApp.use(express.static(join(__dirname, 'web')));

let controller: AbortController | undefined;
let childProcess: ChildProcess | undefined;
const listeners: Record<string, unknown> = {};

function sendToSocket(msg: ISocketMessage) {
  for (const listener in listeners) {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    (listeners[listener] as WebSocket).send(JSON.stringify(msg));
  }
}

// Use getter and setter to notify socket of status updates
const state = {
  _status: Status.IDLE,

  get status() {
    return state._status;
  },

  set status(status: Status) {
    state._status = status;
    sendToSocket({
      action: 'status',
      data: status,
    })
  }
}


function startSubprocess() {
  if (!controller && !childProcess) {
    logger.info('Start command received');

    controller = new AbortController();
    const { signal } = controller;
    childProcess = fork(join(__dirname, './process.js'), ['child'], { signal });

    childProcess.on('close', () => {
      clearSubprocess();
    })
    childProcess.on('exit', () => {
      clearSubprocess();
    })
    childProcess.on('error', () => {
      clearSubprocess(Status.ERROR);
    })

    // Pass along logging from child process to the socket for the UI to show
    childProcess.on('message', (msg) => {
      // eslint-disable-next-line @typescript-eslint/no-base-to-string, @typescript-eslint/no-unsafe-assignment
      const data: ISocketMessage = JSON.parse(msg.toString());
      sendToSocket(data);
    })

    state.status = Status.RUNNING;
  }  else {
    throw new Error('There is already a process running');
  }
}

function clearSubprocess(status?: Status) {
  controller = undefined;
  childProcess = undefined;
  state.status = status ?? Status.STOPPED;
}

function stopSubprocess() {
  if (controller && childProcess) {
    logger.info('Stop command received');
    controller.abort();
    clearSubprocess();
  }
}

// Setup the websocket connection
app.ws('/socket', (ws) => {
  const id = uuid();
  listeners[id] = ws;
  ws.on('close', () => { delete listeners[id]; });
  ws.on('message', (data: RawData) => {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string, @typescript-eslint/no-unsafe-assignment
    const msg: ISocketMessage = JSON.parse(data.toString());

    if (msg.action === 'start') {
      startSubprocess();
    } else if (msg.action === 'stop') {
      stopSubprocess();
    }
  });

  ws.send(JSON.stringify({
    action: 'status',
    data: state.status,
  }))
});

process.on('beforeExit', () => {
  stopSubprocess();
});

app.listen(3000, () => {
  console.log('Server is running...')
});
