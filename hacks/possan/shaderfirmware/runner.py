import machine, neopixel
from _thread import start_new_thread
import time
from math import sin, cos, radians
from shader import shader

global v1,v2,v3
n_leds = 16
v1 = 150
v2 = 0
v3 = 0
v4 = 0

np = neopixel.NeoPixel(machine.Pin(19), n_leds)
np[0] = (255, 0, 0)
np[1] = (0, 128, 0)
np[2] = (0, 0, 64)
np[3] = (0, 0, 0)
np[4] = (0, 0, 0)
np.write()

def step():
  T = time.ticks_us()
  try:
    for x in range(0, n_leds):
      shader(np, x, T / 1000000.0, x / n_leds, v1, v2, v3, v4)
  except:
    np[0] = (255, 0, 0)
    np[1] = (255, 0, 0)
    np[2] = (0, 0, 0)
    np[3] = (255, 0, 0)
    np[4] = (255, 0, 0)
  np.write()

def thread1():
  while True:
    step()
    time.sleep_ms(16)

start_new_thread(thread1, ())
