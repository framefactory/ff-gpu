/**
 * FF Typescript Foundation Library - WebGPU Tools
 * Copyright 2022 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */


import { PipelineCache } from "./PipelineCache.js";


export class TextureGenerator
{
    readonly device: GPUDevice;
    
    protected uniformArray: Float32Array;

    private _texture: GPUTexture;
    private _uniformBuffer: GPUBuffer;
    private _bindGroupLayout: GPUBindGroupLayout;
    private _bindGroup: GPUBindGroup;
    private _pipeline: GPUComputePipeline;


    constructor(cache: PipelineCache, module: GPUShaderModule, entryPoint: string,
        size: number[], format: GPUTextureFormat, uniformElements: number)
    {
        const device = this.device = cache.device;

        this.uniformArray = new Float32Array(uniformElements);
        const uniformBytes = this.uniformArray.byteLength;

        this._uniformBuffer = device.createBuffer({
            size: uniformBytes,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        this._bindGroupLayout = cache.createBindGroupLayout({
            entries: [{
                binding: 0,
                buffer: { type: "uniform" },
                visibility: GPUShaderStage.COMPUTE,
            }, {
                binding: 1,
                storageTexture: { format: "r32float" },
                visibility: GPUShaderStage.COMPUTE,
            }],
        });

        const layout = cache.createPipelineLayout({
            bindGroupLayouts: [ this._bindGroupLayout ]
        });

        this._pipeline = cache.createComputePipeline({
            layout,
            compute: {
                module,
                entryPoint,
            },
        });

        this._createTextureAndBindGroup(size, format);
    }

    get texture(): GPUTexture {
        return this._texture;
    }

    update()
    {
        const device = this.device;
        device.queue.writeBuffer(this._uniformBuffer, 0, this.uniformArray, 0);
        const encoder = device.createCommandEncoder();
        
        const pass = encoder.beginComputePass();
        pass.setBindGroup(0, this._bindGroup);
        pass.setPipeline(this._pipeline);
        pass.dispatchWorkgroups(this._texture.width, this._texture.height);
        pass.end();

        device.queue.submit([ encoder.finish() ]);
    }

    resize(size: number[])
    {
        this._texture.destroy();
        this._createTextureAndBindGroup(size, this._texture.format);
    }

    private _createTextureAndBindGroup(size: number[], format: GPUTextureFormat)
    {
        this._texture = this.device.createTexture({
            size, 
            format, 
            usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING,
        });

        this._bindGroup = this.device.createBindGroup({
            layout: this._bindGroupLayout,
            entries: [{
                binding: 0,
                resource: { buffer: this._uniformBuffer }
            }, {
                binding: 1,
                resource: this._texture.createView(),
            }],
        });
    }
}