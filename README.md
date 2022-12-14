# FF GPU - Typescript Foundation Library

Copyright 2022 [Frame Factory GmbH](https://framefactory.ch), [Ralph Wiedemeier](https://about.me/ralphw)  
[License: MIT](./LICENSE.md)

## Tools and Utilities for WebGPU

- `PipelineCache` implements a cache for GPU objects including shader modules,
  bind group layouts, pipeline layouts, render and compute pipelines.
- `Surface` prepares a `HTMLCanvasElement` as a target for WebGPU rendering
  and provides helper methods for resize, etc.
- `ComputePipelineBuilder` helps creating compute shader with
  uniform parameters and bindings.
- `TextureLoader` provides methods for creating textures from image URLs
  and HTML image, video, and canvas elements.
- `TexturePool` provides a pool of recyclable textures.
- `UniformBuffer` manages a buffer of uniform parameters and the corresponding
  bind group layout and shader struct declaration.
- `MipmapGenerator` uses a compute shader to generate texture mip levels.
- `GaussianBlur` is a fast incremental implementation of, well, a gaussian blur
  filter using compute shaders.
- `TextureGenerator` is a base class for procedural textures.

> **Note**  
> Library is early stage and work in progress. Expect
bugs and frequent breaking changes.
