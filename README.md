# Raster Blaster

Blast rasters to a canvas with speed and style.

Given multi-band raster data, for example satellite imagery, this module renders them to a canvas, allowing arbitrary mappings of raster bands to canvas color channels. This makes it easy and fast to make contrast adjustments, calculate vegetation index like NDVI and many other common operations.

[Tiny example of Raster Blaster in action](https://www.liedman.net/raster-blaster/)

Under the hood, uses WebGL when available for high performance, falling back to standard canvas operations if needed.

_Note_ Work in progress or rather proof of concept, probably not suitable for production at this point.

## Example

```js
import { Pipeline, WebGlRenderer, PipelineSteps } from 'RasterBlaster'

// A pipeline is a series of functions that are applied to
// the raster data before it is rendered to the canvas
const pipeline = new Pipeline([
  // Convert bands to grayscale using a formula;
  // $r is the incoming "r" band
  new PipelineSteps.GrayScale('$r+$g-$b'),
  // Apply smoothstep to each channel (r, g, b, a)
  new PipelineSteps.SmoothstepContrast(0.2, 0.8),
  // Take the first channel and map its value to rgb values
  // using a named colormap
  new PipelineSteps.ColorMap('RdYlGn'),
  // Set one or more channels directly from raster bands
  new PipelineSteps.BandsToChannels({ a: 'a' })
],
{
  // Map (arbitrary) band names to their indices
  bands: 'rgba',
  dataType: 'Uint8'
})

// A renderer can render raster data to a canvas using a pipeline
// By default, the renderer renders to a 256x256 pixel canvas
const renderer = new WebGlRenderer()
const canvas = document.createElement('canvas')
canvas.width = canvas.height = 256
document.body.appendChild(canvas)

renderer.render(
  canvas,
  pipeline, 
  /* Function that returns a promise that resolves to an array of typed arrays, one for each band */
})
```
