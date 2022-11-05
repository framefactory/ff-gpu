/**
 * FF Typescript Foundation Library
 * Copyright 2022 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import mipmapCode from "../shader/mipmap.wgsl";

/**
 * Simple texture mipmap generator. A compute shader is used
 * to calculate mip levels for the provided texture.
 */
export class MipmapGenerator
{
    readonly device: GPUDevice;

    private _pipeline: GPUComputePipeline;
    private _bindGroupLayout: GPUBindGroupLayout;

    constructor(device: GPUDevice)
    {
        this.device = device;

        this._bindGroupLayout = device.createBindGroupLayout({
            entries: [{
                binding: 0,
                visibility: GPUShaderStage.COMPUTE,
                texture: {},
            }, {
                binding: 1,
                visibility: GPUShaderStage.COMPUTE,
                storageTexture: { format: "rgba8unorm" },
            }],
        });

        const pipeLayout = device.createPipelineLayout({
            bindGroupLayouts: [ this._bindGroupLayout ],
        });

        const mipmapModule = device.createShaderModule({
            code: mipmapCode,
        });

        this._pipeline = device.createComputePipeline({
            layout: pipeLayout,
            compute: {
                module: mipmapModule,
                entryPoint: "main",
            }
        });
    }

    /**
     * Generates mip levels for the provided texture.
     * @param texture Texture with pre-allocated mip levels in 'rgba8unorm' format.
     */
    generateMipmap(texture: GPUTexture)
    {
        if (texture.mipLevelCount == 1) {
            throw RangeError("texture.mipLevelCount must be greater than 1");
        }
        if (texture.format !== "rgba8unorm") {
            throw RangeError("texture.format must be 'rgba8unorm'");
        }

        let { width, height, mipLevelCount } = texture;

        const device = this.device;
        const encoder = device.createCommandEncoder();

        for (let level = 1; level < mipLevelCount; ++level) {
            width = Math.floor(width / 2);
            height = Math.floor(height / 2);

            const bindGroup = device.createBindGroup({
                layout: this._bindGroupLayout,
                entries: [{
                    binding: 0,
                    resource: texture.createView(
                        { baseMipLevel: level - 1, mipLevelCount: 1 }),
                }, {
                    binding: 1,
                    resource: texture.createView(
                        { baseMipLevel: level, mipLevelCount: 1 }),
                }],
            });

            const pass = encoder.beginComputePass();
            pass.setPipeline(this._pipeline);
            pass.setBindGroup(0, bindGroup);
            pass.dispatchWorkgroups(width, height);
            pass.end();
        }

        device.queue.submit([ encoder.finish() ]);
    }
}