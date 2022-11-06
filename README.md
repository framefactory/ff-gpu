# FF GPU - Typescript Foundation Library

Copyright 2022 [Frame Factory GmbH](https://framefactory.ch), [Ralph Wiedemeier](https://about.me/ralphw)  
[License: MIT](./LICENSE.md)

## Tools and Utilities for WebGPU

- `Surface` prepares a `HTMLCanvasElement` as a target for WebGPU rendering
  and provides helper methods for resize, etc.
- `TextureLoader` provides methods for creating textures from image URLs
  and HTML image, video, and canvas elements.
- `MipmapGenerator` uses a compute shader to generate texture mip levels.
- `GaussianBlur` is a fast incremental implementation of, well, a gaussian blur
  filter using compute shaders.

> **Note**  
> Library is early stage and work in progress. Expect
bugs and frequent breaking changes.
