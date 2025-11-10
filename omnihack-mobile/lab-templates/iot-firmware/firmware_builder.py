import os
seed = os.environ.get('IOT_SEED', 'cafebabe')
with open('/opt/firmware.bin', 'wb') as fw:
    fw.write(f"IOTFLAG-{seed}".encode())
while True:
    pass
