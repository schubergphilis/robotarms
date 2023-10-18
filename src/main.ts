import express, { Express } from 'express';
import expressWs from 'express-ws';
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

const baseApp: Express = express();
const { app } = expressWs(baseApp)
baseApp.use(express.static(join(__dirname, 'web')));

let status: Status = Status.IDLE;
let controller: AbortController | undefined;
let childProcess: ChildProcess | undefined;
const listeners: Record<string, unknown> = {};


function startSubprocess() {
  if (!controller && !childProcess) {
    controller = new AbortController();
    const { signal } = controller;
    childProcess = fork(join(__dirname, './process.js'), ['child'], { signal });

    childProcess.on('close', () => {
      status = Status.STOPPED;
      clearSubprocess();
    })
    childProcess.on('exit', () => {
      status = Status.STOPPED;
      clearSubprocess();
    })
    childProcess.on('error', () => {
      clearSubprocess();
      status = Status.ERROR;
    })
    childProcess.on('message', (msg) => {
      for (const listener in listeners) {
        // eslint-disable-next-line @typescript-eslint/no-base-to-string
        (listeners[listener] as WebSocket).send(msg.toString());
      }
    })

    status = Status.RUNNING;
  }  else {
    throw new Error('There is already a process running');
  }
}

function clearSubprocess() {
  controller = undefined;
  childProcess = undefined;
  status = Status.STOPPED;
}

function stopSubprocess() {
  if (controller && childProcess) {
    controller.abort();
    clearSubprocess();
  } else {
    throw new Error('No process running');
  }
}

// Starts the subprocess for the robot arms
app.get('/start', (_, res) => {
  console.log('[Server] Received start request');
  try {
    startSubprocess();
    res.send('Started!');
  } catch (e: unknown) {
    console.log(e);
    res.status(500).send(e);
  }
});

// Stops the subprocess for the robot arms
app.get('/stop', (_, res) => {
  console.log('[Server] Received stop request');
  try {
    stopSubprocess();
    res.send('Stopped!');
  } catch (e: unknown) {
    res.status(500).send(e);
  }
});

// Returns the current status of the process
app.get('/status', (_, res) => {
  res.send({ status })
});

app.get('/kill', (_, res) => {
  if (childProcess) {
    childProcess.send('emergency-stop')
    status = Status.STOPPED;
    res.send('Stopped!');
  } else {
    res.status(400).send('No process running at the moment');
  }
});

app.ws('/logging', (ws) => {
  const id = uuid();
  listeners[id] = ws;
  ws.on('close', () => { delete listeners[id]; });
});

process.on('beforeExit', () => {
  stopSubprocess();
});

app.listen(3000, () => {
  console.log('Server is running...')
});
