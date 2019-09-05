# Raster Blaster

Blast rasters to a canvas with speed and style.

Given multi-band raster data, for example satellite imagery, this module renders them to a canvas, allowing arbitrary mappings of raster bands to canvas color channels. This makes it easy and fast to make contrast adjustments, calculate vegetation index like NDVI and many other common operations.

[Tiny example of Raster Blaster in action](https://www.liedman.net/raster-blaster/)

Under the hood, uses WebGL when available for high performance, falling back to standard canvas operations if needed.

_Note_ Work in progress or rather proof of concept, probably not suitable for production at this point.

## Example

```js
import { Pipeline, WebGlRenderer, PipelineSteps } from 'RasterBlaster'

const pipeline = new Pipeline([
  new PipelineSteps.Index('$r+$g-$b'),
  new PipelineSteps.LinearContrast(0.0, 1.0),
  new PipelineSteps.ColorMap('RdYlGn'),
  new PipelineSteps.BandsToChannels({ a: 'a' })
],
{
  // Map (arbitrary) band names to their indices
  bands: {
    'r': 0,
    'g': 1,
    'b': 2,
    'a': 3
  },
  dataType: 'Uint8'
})

const renderer = new WebGlRenderer()
const canvas = document.createElement('canvas')
canvas.width = canvas.height = 256
document.body.appendChild(canvas)

renderer.render(canvas, pipeline, {
  getRasters: () => // Function that returns a promise that resolves to an array of typed arrays, one for each band
})
```
