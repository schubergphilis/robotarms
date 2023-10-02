import express, { Express } from 'express';
import { join } from 'path';
import { fork, ChildProcess } from 'node:child_process';

enum Status {
  RUNNING = 'Running',
  IDLE = 'Idle',
  FINISHED = 'Finished',
  ERROR = 'Error',
  STOPPED = 'Stopped'
}

const app: Express = express();
app.use(express.static('./src/web'));

let status: Status = Status.IDLE;
let controller: AbortController | undefined;
let childProcess: ChildProcess | undefined;

function startSubprocess() {
  if (!controller && !childProcess) {
    controller = new AbortController();
    const { signal } = controller;
    childProcess = fork(join(__dirname, './process.js'), ['child'], { signal });

    childProcess.on('close', () => {
      status = Status.STOPPED;
    })
    childProcess.on('exit', () => {
      status = Status.STOPPED;
    })
    childProcess.on('error', () => {
      status = Status.ERROR;
    })
    childProcess.on('message', (data) => {
      console.log('received message from child: ', data)
    })


    status = Status.RUNNING;
  }  else {
    throw new Error('There is already a process running');
  }
}

function stopSubprocess() {
  if (controller && childProcess) {
    controller.abort();
    controller = undefined;
    childProcess = undefined;
    status = Status.STOPPED;
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

process.on('beforeExit', () => {
  stopSubprocess();
});

app.listen(3000, () => {
  console.log('Server is running...')
});
