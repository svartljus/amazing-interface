SSID="Studio Tau"
PASSWORD="transforma"
#SSID="lokalet"
#PASSWORD="ostbollar1"


import network, time

print ("Starting graphics")
import runner

print ("Connecting to WiFi (%s)..." % (SSID))
wlan = network.WLAN(network.STA_IF)
wlan.active(True)
wlan.connect(SSID, PASSWORD)
wlan.config('mac')
time.sleep(4)
wlan.ifconfig()

print ("Starting WebRepl")
import webrepl
webrepl.start()
