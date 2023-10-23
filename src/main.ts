import express, { Express } from 'express';
import expressWs from 'express-ws';
import { RawData } from 'ws';
import { join } from 'path';
import { fork, ChildProcess } from 'node:child_process';
import { v4 as uuid } from 'uuid';

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

let status: Status = Status.IDLE;
let controller: AbortController | undefined;
let childProcess: ChildProcess | undefined;
const listeners: Record<string, unknown> = {};

function sendToSocket(msg: ISocketMessage) {
  for (const listener in listeners) {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    (listeners[listener] as WebSocket).send(JSON.stringify(msg));
  }
}


function startSubprocess() {
  if (!controller && !childProcess) {
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
    childProcess.on('message', (msg) => {
      // eslint-disable-next-line @typescript-eslint/no-base-to-string, @typescript-eslint/no-unsafe-assignment
      const data: ISocketMessage = JSON.parse(msg.toString());
      sendToSocket(data);
    })

    status = Status.RUNNING;
  }  else {
    throw new Error('There is already a process running');
  }
}

function clearSubprocess(status?: Status) {
  controller = undefined;
  childProcess = undefined;
  status = status ?? Status.STOPPED;
}

function stopSubprocess() {
  if (controller && childProcess) {
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
    status,
  }))
});

process.on('beforeExit', () => {
  stopSubprocess();
});

app.listen(3000, () => {
  console.log('Server is running...')
});
