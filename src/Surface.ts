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
    device: Readonly<GPUDevice>;
    context: Readonly<GPUCanvasContext>;
    readonly format: GPUTextureFormat;
    readonly size: GPUExtent3DDictStrict;

    /**
     * Creates a surface instance by configuring the given {@link HTMLCanvasElement}
     * for use with the given {@link GPUDevice}.
     */
    constructor(device: GPUDevice, canvas: HTMLCanvasElement, transparent = false)
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

    get canvas(): HTMLCanvasElement | OffscreenCanvas {
        return this.context.canvas;
    }

    getCurrentTexture(): GPUTexture
    {
        return this.context.getCurrentTexture();
    }

    getCurrentTextureView(): GPUTextureView
    {
        return this.context.getCurrentTexture()?.createView();
    }

    resize(width: number, height: number)
    {
        this.size.width = width;
        this.size.height = height;

        const canvas = this.canvas;
        if (canvas instanceof HTMLCanvasElement) {
            canvas.width = width;
            canvas.height = height;    
        }
    }

    destroy()
    {
        this.context.unconfigure();
        this.device = null;
        this.context = null;
    }
}