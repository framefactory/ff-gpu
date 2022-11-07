/**
 * FF Typescript Foundation Library - WebGPU Tools
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

    async fetchTextureFromImageUrl(url: string,
        allocateMipmaps = false): Promise<GPUTexture>
    {
        const result = await fetch(url);
        const blob = await result.blob();
        const bitmap = await createImageBitmap(blob);

        return this.createTexture(bitmap, allocateMipmaps);
    }

    async createTextureFromImageElement(image: HTMLImageElement,
        allocateMipmaps = false): Promise<GPUTexture>
    {
        await image.decode();
        const bitmap = await createImageBitmap(image);
        return this.createTexture(bitmap, allocateMipmaps);
    }

    createTexture(source: GPUExternalImage,
        allocateMipmaps = false): GPUTexture
    {
        let usage
            = GPUTextureUsage.TEXTURE_BINDING
            | GPUTextureUsage.COPY_DST
            | GPUTextureUsage.RENDER_ATTACHMENT;

        const { width, height } = source;
        let mipLevelCount = 1;

        if (allocateMipmaps) {
            usage |= GPUTextureUsage.STORAGE_BINDING;
            const size = Math.max(width, height);
            mipLevelCount = Math.floor(Math.log2(size)) + 1;    
        }

        const descriptor: GPUTextureDescriptor = {
            size: { width: source.width, height: source.height,  },
            mipLevelCount,
            format: "rgba8unorm",
            usage,
        };

        const texture = this.device.createTexture(descriptor);

        this.device.queue.copyExternalImageToTexture({ source }, { texture },
            descriptor.size);

        return texture;
    }
}