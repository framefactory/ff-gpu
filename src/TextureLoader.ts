/**
 * FF Typescript Foundation Library
 * Copyright 2022 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

export type GPUExternalImage =
    | ImageBitmap
    | HTMLVideoElement
    | HTMLCanvasElement
    | OffscreenCanvas;

export class TextureLoader
{
    readonly device: GPUDevice;

    constructor(device: GPUDevice)
    {
        this.device = device;
    }

    async fetchTextureFromImageUrl(url: string): Promise<GPUTexture>
    {
        const result = await fetch(url);
        const blob = await result.blob();
        const bitmap = await createImageBitmap(blob);

        return this.createTexture(bitmap);
    }

    async createTextureFromImageElement(image: HTMLImageElement): Promise<GPUTexture>
    {
        await image.decode();
        const bitmap = await createImageBitmap(image);
        return this.createTexture(bitmap);
    }

    createTexture(source: GPUExternalImage, generateMipmap = false): GPUTexture
    {
        const usage
            = GPUTextureUsage.TEXTURE_BINDING
            | GPUTextureUsage.COPY_DST
            | GPUTextureUsage.RENDER_ATTACHMENT;

        const descriptor: GPUTextureDescriptor = {
            size: { width: source.width, height: source.height,  },
            format: "rgba8unorm",
            usage,
        };

        const texture = this.device.createTexture(descriptor);

        this.device.queue.copyExternalImageToTexture({ source }, { texture },
            descriptor.size);

        return texture;
    }

    generateMipmap(texture: GPUTexture)
    {
        // TODO
    }
}