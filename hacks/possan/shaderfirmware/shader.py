from math import sin, cos

def shader(pixelarray, i, t, pct, v1, v2, v3, v4):
  rt = t + pct * 5.0
  pixelarray[i] = (
    int(min(255, max(0, v1 + (v1 * 0.9 * sin(1.2 * rt))))),
    int(min(255, max(0, v2 + (v2 * 0.9 * cos(1.7 * rt))))),
    int(min(255, max(0, v3 + (v3 * 0.9 * sin(1.1 * rt))))))
