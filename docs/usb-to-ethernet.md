# SER2NET setup
A Raspberry PI is used to convert the USB serial connections of the arms and cameras to ethernet/TCP.
Allowing Docker containers etc to connect to the physical hardware.

## Preparation
Setup the PI as normal with a Raspbian image.

## Installing Ser2Net
Run the following commands to update the PI and install Ser2Net.
`sudo apt update`
`sudo apt upgrade -y`
`sudo apt install ser2net -y`

## Configuring Ser2Net
The configuration should be put in: `/etc/ser2net.yaml`.
Below configuration will expose both connectboxes and a camera:

```
connection: &con0192
    accepter: tcp,3000
    enable: on
    options:
      banner: ''
      kickolduser: true
      telnet-brk-on-sync: true
      sendon: '\n'
      openstr: ''
      closestr: ''
      signature: ''
    connector: serialdev,
              /dev/ttyUSB0,
              115200n81,local

connection: &con1192
    accepter: tcp,3001
    enable: on
    options:
      banner: ''
      kickolduser: true
      telnet-brk-on-sync: true
      sendon: '\n'
      openstr: ''
      closestr: ''
      signature: ''
    connector: serialdev,
              /dev/ttyUSB1,
              115200n81,local

connection: &con2192
    accepter: tcp,3002
    enable: on
    options:
      kickolduser: true
      telnet-brk-on-sync: true
    connector: serialdev,
              /dev/ttyACM0,
              19200n81,local
```
