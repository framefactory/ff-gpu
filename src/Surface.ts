/**
 * FF Typescript Foundation Library
 * Copyright 2022 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

/**
 * The surface class represents a HTML canvas element configured for WebGPU use
 * with a specific {@link GPUDevice}.
 */
export class Surface
{
    /** The GPU device used with this surface. */
    device: Readonly<GPUDevice>;
    /** The WebGPU context for this surface. */
    context: Readonly<GPUCanvasContext>;
    /** The format of the surface. */
    readonly format: GPUTextureFormat;
    /** The size of the surface. */
    readonly size: GPUExtent3DDictStrict;

    /**
     * Creates a surface instance by configuring the given {@link HTMLCanvasElement}
     * for use with the given {@link GPUDevice}.
     */
    constructor(device: GPUDevice, canvas: HTMLCanvasElement | OffscreenCanvas, transparent = false)
    {
        this.device = device;
        this.context = canvas.getContext("webgpu");
        this.format = navigator.gpu.getPreferredCanvasFormat();
        this.size = {
            width: canvas.width,
            height: canvas.height,
        };

        this.context.configure({
            device,
            format: this.format,
            alphaMode: transparent ? "premultiplied" : "opaque",
        });
    }

    /**
     * Returns the canvas this surface belongs to.
     */
    get canvas(): HTMLCanvasElement | OffscreenCanvas {
        return this.context.canvas;
    }

    /**
     * Retrieves a target texture to render onto this surface.
     */
    getCurrentTexture(): GPUTexture
    {
        return this.context.getCurrentTexture();
    }

    /**
     * Retrieves a texture view for the current target texture.
     */
    getCurrentTextureView(): GPUTextureView
    {
        return this.context.getCurrentTexture()?.createView();
    }

    /**
     * Changes the size of the surface.
     * @param width Width in physical pixels.
     * @param height Height in physical pixels.
     */
    resize(width: number, height: number)
    {
        this.size.width = width;
        this.size.height = height;

        this.canvas.width = width;
        this.canvas.height = height;    
    }

    /**
     * Destroys the surface including the underlying WebGPU context.
     */
    destroy()
    {
        this.context.unconfigure();
        this.device = null;
        this.context = null;
    }
}