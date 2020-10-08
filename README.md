# greeblies
This is a web-based, parametric modeler for making 3d-printable panels worth of tech ["greeblies/nurnies"](https://en.wikipedia.org/wiki/Greeble).

Click on this image to see a video of the system in action

[![link to demo video](https://img.youtube.com/vi/WRCzxcN5BWo/0.jpg)](https://www.youtube.com/watch?v=WRCzxcN5BWo)

The system starts out with a basic shape, and allows the user to click-and-drag to define rectangular regions that are then replaced with a new feature. So far, the supported features are:

- An extrusion (with beveled edges)
- an array of buttons (or, with a negative extrude amount, holes)
- a pair of handles similar to what you see on rack-mounted equipment
- a dial of the type you might see representing voltage or other analog values

All of the above have various parametric attributes, and all of the geometry is generated on the fly without any model imports. The resulting mesh is also water-tight and appropriate for 3d printing.

Now with STL export support!

See the current version in action for yourself at [http://www.zanzastoys.com/tools/techpanels/](http://www.zanzastoys.com/tools/techpanels/)

