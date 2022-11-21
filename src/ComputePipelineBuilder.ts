/**
 * FF Typescript Foundation Library - WebGPU Tools
 * Copyright 2022 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import { PipelineCache } from "./PipelineCache.js";
import { UniformBuffer } from "./UniformBuffer.js";

////////////////////////////////////////////////////////////////////////////////

export class ComputePipelineBuilder
{
    readonly cache: PipelineCache;
    readonly uniforms: UniformBuffer;

    private _binding: number;
    private _bindGroupLayoutEntries: GPUBindGroupLayoutEntry[];

    constructor(cache: PipelineCache)
    {
        this.cache = cache;
        this.uniforms = new UniformBuffer(cache.device);

        this._binding = 1;
        this._bindGroupLayoutEntries = [{
            binding: 0,
            visibility: GPUShaderStage.COMPUTE
        }];
    }

    addBuffer(layout: GPUBufferBindingLayout = {}): this
    {
        this._bindGroupLayoutEntries.push({
            binding: this._binding++,
            visibility: GPUShaderStage.COMPUTE,
            buffer: layout,
        });

        return this;
    }

    addSampler(layout: GPUSamplerBindingLayout = {}): this
    {
        this._bindGroupLayoutEntries.push({
            binding: this._binding++,
            visibility: GPUShaderStage.COMPUTE,
            sampler: layout,
        });

        return this;
    }

    addTexture(layout: GPUTextureBindingLayout = {}): this
    {
        this._bindGroupLayoutEntries.push({
            binding: this._binding++,
            visibility: GPUShaderStage.COMPUTE,
            texture: layout,
        });

        return this;
    }

    addStorageTexture(format: GPUTextureFormat = "rgba32float",
                      viewDimension: GPUTextureViewDimension = "2d"): this
    {
        const storageTexture: GPUStorageTextureBindingLayout = { format };
        if (viewDimension !== "2d") {
            storageTexture.viewDimension = viewDimension;
        }

        this._bindGroupLayoutEntries.push({
            binding: this._binding++,
            visibility: GPUShaderStage.COMPUTE,
            storageTexture,
        });

        return this;
    }

    addExternalTexture(layout: GPUExternalTextureBindingLayout = {}): this
    {
        this._bindGroupLayoutEntries.push({
            binding: this._binding++,
            visibility: GPUShaderStage.COMPUTE,
            externalTexture: layout,
        });

        return this;
    }

    create(shaderCode: string, entryPoint: string): GPUComputePipeline
    {
        this.uniforms.create();
        this._bindGroupLayoutEntries[0] =
            this.uniforms.createBindGroupLayoutEntry(0, GPUShaderStage.COMPUTE);

        const bindGroupLayout = this.cache.createBindGroupLayout({
            entries: this._bindGroupLayoutEntries,
        });

        const pipelineLayout = this.cache.createPipelineLayout({
            bindGroupLayouts: [ bindGroupLayout ],
        });

        const shaderModule = this.cache.createShaderModule({
            code: this.uniforms.createShaderStruct() + shaderCode,
        });

        return this.cache.createComputePipeline({
            layout: pipelineLayout,
            compute: {
                entryPoint,
                module: shaderModule,
            },
        });
    }
}