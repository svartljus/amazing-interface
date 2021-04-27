import machine, neopixel
import gc
gc.collect()

nleds = 16*8 # Pixel Kit dimensions
np = neopixel.NeoPixel(machine.Pin(4), nleds)
c = (255, 0, 0)

colors = [(0, 0, 0),(0, 0, 10),(10, 0, 10),(0, 10, 0),(5, 3, 0),(0, 0, 15),(10, 10, 15),(20, 20, 20),(20, 0, 10),(10, 10, 0),(20, 20, 0),(10, 20, 10),(10, 10, 20),(5, 5, 5),(20, 10, 10),(20, 15, 10)]

n = None
# tiny wireworld rules
rules = ((((n, n, n),(n, 3, n),(n, n, n)),((n, n, n),(n, 2, n),(n, n, n))),(((n, n, n),(n, 2, n),(n, n, n)),((n, n, n),(n, 1, n),(n, n, n))),(((n, n, n),(3, 1, n),(n, n, n)),((n, n, n),(n, 3, n),(n, n, n))),(((3, n, n),(n, 1, n),(n, n, n)),((n, n, n),(n, 3, n),(n, n, n))),(((n, 3, n),(n, 1, n),(n, n, n)),((n, n, n),(n, 3, n),(n, n, n))),(((n, n, 3),(n, 1, n),(n, n, n)),((n, n, n),(n, 3, n),(n, n, n))),(((n, n, n),(n, 1, 3),(n, n, n)),((n, n, n),(n, 3, n),(n, n, n))),(((n, n, n),(n, 1, n),(n, n, 3)),((n, n, n),(n, 3, n),(n, n, n))),(((n, n, n),(n, 1, n),(n, 3, n)),((n, n, n),(n, 3, n),(n, n, n))),(((n, n, n),(n, 1, n),(3, n, n)),((n, n, n),(n, 3, n),(n, n, n))))

def get_grid():
    return [
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
]

def copy_2d(array):
    n = get_grid()
    for y, row in enumerate(array):
        n[y] = row.copy()
    return n

grid = [
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,1,2,3,1,1,1,1,1,1,1,1,1,1,1,0],
[0,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0],
[0,1,0,1,1,1,0,1,1,1,0,1,1,0,1,0],
[0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,0],
[0,1,0,1,0,1,0,1,0,1,0,1,0,0,0,0],
[0,1,1,1,0,1,1,1,0,1,1,1,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
]

def match_rule(around, when):
    matched = True
    for y in range(0, 3):
        for x in range(0, 3):
            if when[y][x] != n and when[y][x] != around[y][x]:
                matched = False
    return matched

def apply_rules():
    global grid
    step = copy_2d(grid)
    for y in range(1, 7):
        for x in range(1, 15):
            cell = grid[y][x]
            for rule in rules:
                when = rule[0]
                then = rule[1]
                if when[1][1] == cell:
                    startX = x-1
                    endX = x+2
                    aroundCell = [
                        grid[max(y-1,0)][startX:endX],
                        grid[y][startX:endX],
                        grid[min(y+1, 8)][startX:endX]
                    ]
                    matched = match_rule(aroundCell, when)
                    if matched is True:
                        for ly in range(0, 3):
                            for lx in range(0, 3):
                                if then[ly][lx] != n:
                                    step[y-1+ly][x-1+lx] = then[ly][lx]
    grid = step

def render():
    for y, row in enumerate(grid):
        for x, c in enumerate(row):
            _x = x % 16
            _y = int(y * 16)
            np[_x+_y] = colors[c]
    np.write()

while True:
    apply_rules()
    render()
