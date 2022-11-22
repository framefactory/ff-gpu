/**
 * FF Typescript Foundation Library - WebGPU Tools
 * Copyright 2022 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import { hashObject } from "@ffweb/core/hash.js";

export class TexturePool
{
    readonly device: GPUDevice;
    private _pool: Map<string, GPUTexture[]>;

    constructor(device: GPUDevice)
    {
        this.device = device;
        this._pool = new Map();
    }

    /**
     * Borrows a texture from the pool. If the pool doesn't have a texture
     * corresponding to the description, a new texture is created and returned.
     */
    allocateTexture(desc: GPUTextureDescriptor): GPUTexture
    {
        const hash = hashObject(desc);
        let bin = this._pool.get(hash);

        if (bin === undefined) {
            bin = [];
            this._pool.set(hash, bin);
        }

        const n = bin.length;
        if (n > 0) {
            const texture = bin[n - 1];
            bin.length = n - 1;
            return texture;
        }

        desc.label = hash;
        const texture = this.device.createTexture(desc);
        return texture;
    }

    /**
     * Returns the given texture to the pool.
     */
    releaseTexture(texture: GPUTexture)
    {
        const hash = texture.label;
        const bin = this._pool.get(hash);
        if (bin === undefined) {
            throw Error(`Not a pooled texture: '${hash}'`);
        }

        bin.push(texture);
    }

    /**
     * Destroys textures currently in the pool.
     */
    clear()
    {
        for (const bin of this._pool.values()) {
            for (const texture of bin) {
                texture.destroy();
            }

            bin.length = 0;
        }
    }
}