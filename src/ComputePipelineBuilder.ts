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
    readonly params: UniformBuffer;

    private _group: number;
    private _binding: number;
    private _keyIndex: Record<string, number>;
    private _bindGroupLayout: GPUBindGroupLayout;
    private _bindGroupLayoutEntries: GPUBindGroupLayoutEntry[];
    private _bindGroupEntries: GPUBindGroupEntry[];
    private _declarations: string[];

    constructor(cache: PipelineCache, bindGroup = 0)
    {
        this.cache = cache;
        this.params = new UniformBuffer(cache.device);

        this._group = bindGroup;
        this._binding = 1;
        this._keyIndex = {};
        this._bindGroupLayoutEntries = [{
            binding: 0,
            visibility: GPUShaderStage.COMPUTE
        }];
        this._bindGroupEntries = [];
        this._declarations = [
            `@group(${this._group} @binding(0) var<uniform> params: Params;`
        ];
    }

    addParamFloat(key: string): this
    {
        this.params.addFloat(key);
        return this;
    }

    addParamInt(key: string): this
    {
        this.params.addInt(key);
        return this;
    }

    addParamFloatArray(key: string, elementCount: number): this
    {
        this.params.addFloatArray(key, elementCount);
        return this;
    }

    addParamsIntArray(key: string, elementCount: number): this
    {
        this.params.addIntArray(key, elementCount);
        return this;
    }

    addBuffer(key: string, layout: GPUBufferBindingLayout = {}): this
    {
        const binding = this._binding++;
        this._keyIndex[key] = binding;

        this._declarations.push(
            `@group(${this._group}) @binding(${binding}) var ${key}: buffer<>;`
        );

        this._bindGroupLayoutEntries.push({
            binding,
            visibility: GPUShaderStage.COMPUTE,
            buffer: layout,
        });

        return this;
    }

    addSampler(key: string, layout: GPUSamplerBindingLayout = {}): this
    {
        const binding = this._binding++;
        this._keyIndex[key] = binding;

        this._declarations.push(
            `@group(${this._group}) @binding(${binding}) var ${key}: sampler;`
        );

        this._bindGroupLayoutEntries.push({
            binding,
            visibility: GPUShaderStage.COMPUTE,
            sampler: layout,
        });

        return this;
    }

    addTexture(key: string, layout: GPUTextureBindingLayout = {}): this
    {
        const binding = this._binding++;
        this._keyIndex[key] = binding;

        const dim = layout.viewDimension ?? "2d";
        this._declarations.push(
            `@group(${this._group}) @binding(${binding}) var ${key}: texture_${dim}<f32>;`
        );

        this._bindGroupLayoutEntries.push({
            binding,
            visibility: GPUShaderStage.COMPUTE,
            texture: layout,
        });

        return this;
    }

    addStorageTexture(key: string,
                      format: GPUTextureFormat = "rgba32float",
                      viewDimension: GPUTextureViewDimension = "2d"): this
    {
        const binding = this._binding++;
        this._keyIndex[key] = binding;

        const storageTexture: GPUStorageTextureBindingLayout = { format };
        if (viewDimension !== "2d") {
            storageTexture.viewDimension = viewDimension;
        }

        const dim = viewDimension ?? "2d";
        this._declarations.push(
            `@group(${this._group}) @binding(${binding}) var ${key}: texture_storage_${dim}<${format},write>;`
        );

        this._bindGroupLayoutEntries.push({
            binding,
            visibility: GPUShaderStage.COMPUTE,
            storageTexture,
        });

        return this;
    }

    addExternalTexture(key: string, layout: GPUExternalTextureBindingLayout = {}): this
    {
        const binding = this._binding++;
        this._keyIndex[key] = binding;

        this._declarations.push(
            `@group(${this._group}) @binding(${binding}) var ${key}: texture_external;`
        );

        this._bindGroupLayoutEntries.push({
            binding,
            visibility: GPUShaderStage.COMPUTE,
            externalTexture: layout,
        });

        return this;
    }

    createPipeline(shaderCode: string, entryPoint: string): GPUComputePipeline
    {
        this.params.create();
        this._bindGroupLayoutEntries[0] =
            this.params.createBindGroupLayoutEntry(0, GPUShaderStage.COMPUTE);

        this._bindGroupLayout = this.cache.createBindGroupLayout({
            entries: this._bindGroupLayoutEntries,
        });

        const pipelineLayout = this.cache.createPipelineLayout({
            bindGroupLayouts: [ this._bindGroupLayout ],
        });

        const code = [
            this.params.createStructDeclaration("Params"),
            this._declarations.join("\n"),
            "\n",
            shaderCode,
        ].join("\n")

        const shaderModule = this.cache.createShaderModule({ code });

        return this.cache.createComputePipeline({
            layout: pipelineLayout,
            compute: {
                entryPoint,
                module: shaderModule,
            },
        });
    }

    setParamFloat(key: string, value: number): this
    {
        this.params.setFloat(key, value);
        return this;
    }

    setParamFloatArray(key: string, array: ArrayLike<number>): this
    {
        this.params.setFloatArray(key, array);
        return this;
    }

    setParamsInt(key: string, value: number): this
    {
        this.params.setInt(key, value);
        return this;
    }

    setParamsIntArray(key: string, array: ArrayLike<number>): this
    {
        this.params.setIntArray(key, array);
        return this;
    }

    bindBuffer(key: string, buffer: GPUBuffer)
    {
        const binding = this._keyIndex[key];

        this._bindGroupEntries[binding] = {
            binding,
            resource: { buffer },
        };
    }

    bindSampler(key: string, sampler: GPUSampler)
    {
        const binding = this._keyIndex[key];

        this._bindGroupEntries[binding] = {
            binding,
            resource: sampler,
        };
    }

    bindTexture(key: string, texture: GPUTexture)
    {
        const binding = this._keyIndex[key];

        this._bindGroupEntries[binding] = {
            binding,
            resource: texture.createView(),
        };
    }

    bindTextureView(key: string, view: GPUTextureView)
    {
        const binding = this._keyIndex[key];

        this._bindGroupEntries[binding] = {
            binding,
            resource: view,
        };
    }

    bindExternalTexture(key: string, texture: GPUExternalTexture)
    {
        const binding = this._keyIndex[key];

        this._bindGroupEntries[binding] = {
            binding,
            resource: texture,
        };
    }

    createBindGroup(): GPUBindGroup
    {
        return this.cache.device.createBindGroup({
            layout: this._bindGroupLayout,
            entries: this._bindGroupEntries,
        });
    }
}