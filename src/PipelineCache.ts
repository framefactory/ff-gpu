/**
 * FF Typescript Foundation Library - WebGPU Tools
 * Copyright 2022 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import { hashObject } from "@ffweb/core/hash.js";

const _VERBOSE = true;

/**
 * Cached creation functions for {@link GPUShaderModule}, {@link GPUBindGroupLayout},
 * {@link GPUPipelineLayout}, {@link GPURenderPipeline}, and {@link GPUComputePipeline}.
 * From the descriptor given to the creation functions a hash is calculated.
 * If the hash matches that of an already created object, the cached object is returned.
 */
export class PipelineCache
{
    readonly device: GPUDevice;

    private _shaderModules: Map<string, GPUShaderModule>;
    private _bindGroupLayouts: Map<string, GPUBindGroupLayout>;
    private _pipelineLayouts: Map<string, GPUPipelineLayout>;
    private _renderPipelines: Map<string, GPURenderPipeline>;
    private _computePipelines: Map<string, GPUComputePipeline>;

    
    constructor(device: GPUDevice)
    {
        this.device = device;

        this._shaderModules = new Map();
        this._bindGroupLayouts = new Map();
        this._pipelineLayouts = new Map();
        this._renderPipelines = new Map();
        this._computePipelines = new Map();
    }

    clear()
    {
        this._shaderModules.clear();
        this._bindGroupLayouts.clear();
        this._pipelineLayouts.clear();
        this._renderPipelines.clear();
        this._computePipelines.clear();
    }

    createShaderModule(descriptor: GPUShaderModuleDescriptor): GPUShaderModule
    {
        const hash = hashObject(descriptor);

        return this._getOrCreate(this._shaderModules,
            this.device.createShaderModule, descriptor, hash);
    }

    createBindGroupLayout(descriptor: GPUBindGroupLayoutDescriptor): GPUBindGroupLayout
    {
        const hash = hashObject(descriptor);

        return this._getOrCreate(this._bindGroupLayouts,
            this.device.createBindGroupLayout, descriptor, hash);
    }

    createPipelineLayout(descriptor: GPUPipelineLayoutDescriptor): GPUPipelineLayout
    {
        const layouts = Array.from(descriptor.bindGroupLayouts).map(layout => layout.label);
        const hash = layouts.join("/");

        return this._getOrCreate(this._pipelineLayouts,
            this.device.createPipelineLayout, descriptor, hash);
    }

    createRenderPipeline(descriptor: GPURenderPipelineDescriptor): GPURenderPipeline
    {
        if (descriptor.layout === "auto") {
            throw RangeError("layout must not be set to 'auto'");
        }

        const vmHash = descriptor.vertex.module.label;
        const fmHash = descriptor.fragment?.module.label ?? "";
        const bgHash = descriptor.layout.label;

        const hash = `${hashObject(descriptor)}/${bgHash}/${vmHash}/${fmHash}`;

        return this._getOrCreate(this._renderPipelines,
            this.device.createRenderPipeline, descriptor, hash);
    }

    createComputePipeline(descriptor: GPUComputePipelineDescriptor)
    {
        if (descriptor.layout === "auto") {
            throw RangeError("layout must not be set to 'auto'");
        }

        const cmHash = descriptor.compute.module.label;
        const hash = `${hashObject(descriptor)}/${cmHash}`;

        return this._getOrCreate(this._computePipelines,
            this.device.createComputePipeline, descriptor, hash);
    }

    private _getOrCreate<D extends object, O extends { label: string }>(
        cache: Map<string, O>, create: (d: D) => O, descriptor: D, hash: string): O
    {
        let obj = cache.get(hash);
        if (obj) {
            if (_VERBOSE) {
                console.log(`[PipelineCache] HIT, reusing '${obj.constructor.name}' with hash ${hash}`);
            }

            return obj;
        }
     
        obj = create.call(this.device, descriptor);
        
        if (_VERBOSE) {
            console.log(`[PipelineCache] MISS, creating '${obj.constructor.name}' with hash ${hash}`);
        }
     
        if (obj) {
            cache.set(hash, obj);
            obj.label = hash;
        }
        return obj;
    }
}