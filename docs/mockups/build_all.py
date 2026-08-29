"""Rebuild every mockup, SVG and PNG side by side."""
import os, runpy

HERE = os.path.dirname(os.path.abspath(__file__))
PAGES = ["p01_dashboard", "p02_board", "p03_learn", "p04_knowledge",
         "p05_reader", "p06_goals", "p07_progress", "p08_settings", "p09_light"]

for name in PAGES:
    runpy.run_path(os.path.join(HERE, name + ".py"), run_name="__main__")
