/**
 * FF Typescript Foundation Library
 * Copyright 2022 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

export class MipmapGenerator
{
    readonly device: GPUDevice;

    constructor(device: GPUDevice)
    {
        this.device = device;
    }

    generateMipmap(texture: GPUTexture)
    {
        
    }
}