# Color code

Color code is a small programmable cellular automaton.

The first version can be played here (with videos and examples):

http://colorcode.bananabanana.me/

A more advanced version can be played here:

https://murilopolese.github.io/vms/colorcode/v6/

The file `colorcode.py` is a MicroPython implementation of this automaton with the same data structure:

- `colors` array that defines the available states
- `grid` 2D array that stores numbers representing the color index and can be accessed as `grid[y][x]`
- `rules` is a deeply nested array of rules. Each rule has 2 items (when and then in this order) and each item is a 3x3 3D array containing the rules. Notice that `None` is different than `0`.

```
grid =  [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
]
n = None
rules = (
    ( # First rule
      ( # when
        (n, n, n),
        (n, 1, n),
        (n, n, n)
      ),
      ( # then
        (n, n, n),
        (n, 2, n),
        (n, n, n)
      )
    ),
    ( # Second rule
      ( # when
        (n, n, n),
        (n, 2, n),
        (n, n, n)
      ),
      ( # then
        (n, n, n),
        (n, 1, n),
        (n, n, n)
      )
    )
)
```

The default rule in the `colorcode.py` file is [wireworld](http://colorcode.bananabanana.me/#story-6).
