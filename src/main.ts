import express, { Express } from 'express';
import cors from 'cors';
import { fork, ChildProcess } from 'node:child_process';

enum Status {
  RUNNING = 'Running',
  IDLE = 'Idle',
  FINISHED = 'Finished',
  ERROR = 'Error',
  STOPPED = 'Stopped'
}

const app: Express = express();
app.use(cors)

let status: Status = Status.IDLE;
let controller: AbortController | undefined;
let childProcess: ChildProcess | undefined;

function startSubprocess() {
  if (!controller && !childProcess) {
    controller = new AbortController();
    const { signal } = controller;
    childProcess = fork('./process.js', ['child'], { signal });

    childProcess.on('close', () => {})
    childProcess.on('exit', () => {})
    childProcess.on('error', () => {})
    childProcess.on('message', () => {}) // process.send in child


    status = Status.RUNNING;
  }  else {
    throw new Error('There is already a process running');
  }
}

function stopSubprocess() {
  if (controller && childProcess) {
    controller.abort();
    childProcess = undefined;
    status = Status.STOPPED;
  } else {
    throw new Error('No process running');
  }
}

// Starts the subprocess for the roboto arms
app.get('/start', (_, res) => {
  startSubprocess();
  res.send('Started!');
});

// Stops the subprocess for the robot arms
app.get('/stop', (_, res) => {
  stopSubprocess();
  res.send('Stopped!');
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
