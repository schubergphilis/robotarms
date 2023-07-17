def wait_for_movement():
  inByte = ''

  while inByte.find('>'):
    while uart.any() > 0:
      try:
        inByte = uart(uart.any()).decode()
      except Exception:
        print('Failed to decode inbyte string')

  print('finish')
